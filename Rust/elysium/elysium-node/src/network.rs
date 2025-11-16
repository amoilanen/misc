use elysium_core::{Block, Transaction, Result};
use bytes::{Bytes, BytesMut, BufMut};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use std::net::SocketAddr;
use tracing::{info, error, warn};
use serde_json;

/// Message types for P2P communication
#[derive(Debug, Clone)]
pub enum Message {
    NewBlock(Block),
    NewTransaction(Transaction),
    RequestBlocks(u64), // Request blocks from height
    Blocks(Vec<Block>),
    Ping,
    Pong,
}

impl Message {
    /// Serialize message to bytes
    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        let json = serde_json::to_string(self)
            .map_err(|e| elysium_core::ElysiumError::SerializationError(e.to_string()))?;
        Ok(json.into_bytes())
    }
    
    /// Deserialize message from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let json = String::from_utf8(bytes.to_vec())
            .map_err(|e| elysium_core::ElysiumError::SerializationError(e.to_string()))?;
        serde_json::from_str(&json)
            .map_err(|e| elysium_core::ElysiumError::SerializationError(e.to_string()))
    }
}

/// Simple P2P network handler
pub struct Network {
    listen_addr: SocketAddr,
    peers: Vec<SocketAddr>,
}

impl Network {
    /// Create a new network handler
    pub fn new(listen_addr: SocketAddr) -> Self {
        Self {
            listen_addr,
            peers: Vec::new(),
        }
    }
    
    /// Add a peer
    pub fn add_peer(&mut self, peer: SocketAddr) {
        if !self.peers.contains(&peer) {
            self.peers.push(peer);
            info!("Added peer: {}", peer);
        }
    }
    
    /// Start listening for connections
    pub async fn listen(&self) -> Result<tokio::task::JoinHandle<()>> {
        let listener = TcpListener::bind(self.listen_addr)
            .await
            .map_err(|e| elysium_core::ElysiumError::BlockchainError(
                format!("Failed to bind to {}: {}", self.listen_addr, e)
            ))?;
        
        info!("Listening on {}", self.listen_addr);
        
        let handle = tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((stream, addr)) => {
                        info!("New connection from {}", addr);
                        tokio::spawn(async move {
                            if let Err(e) = Self::handle_connection(stream).await {
                                error!("Error handling connection: {}", e);
                            }
                        });
                    }
                    Err(e) => {
                        error!("Error accepting connection: {}", e);
                    }
                }
            }
        });
        
        Ok(handle)
    }
    
    /// Handle a connection
    async fn handle_connection(mut stream: TcpStream) -> Result<()> {
        let mut buffer = BytesMut::with_capacity(4096);
        
        loop {
            match stream.read_buf(&mut buffer).await {
                Ok(0) => break, // Connection closed
                Ok(_) => {
                    // Try to parse message
                    if let Ok(msg) = Message::from_bytes(&buffer) {
                        info!("Received message: {:?}", msg);
                        // In a real implementation, we'd handle the message here
                    }
                    buffer.clear();
                }
                Err(e) => {
                    error!("Error reading from stream: {}", e);
                    break;
                }
            }
        }
        
        Ok(())
    }
    
    /// Send a message to a peer
    pub async fn send_to_peer(&self, peer: SocketAddr, message: Message) -> Result<()> {
        let mut stream = TcpStream::connect(peer)
            .await
            .map_err(|e| elysium_core::ElysiumError::BlockchainError(
                format!("Failed to connect to {}: {}", peer, e)
            ))?;
        
        let bytes = message.to_bytes()?;
        stream.write_all(&bytes).await
            .map_err(|e| elysium_core::ElysiumError::BlockchainError(
                format!("Failed to write to peer: {}", e)
            ))?;
        
        Ok(())
    }
    
    /// Broadcast a message to all peers
    pub async fn broadcast(&self, message: Message) {
        for peer in &self.peers {
            if let Err(e) = self.send_to_peer(*peer, message.clone()).await {
                warn!("Failed to send to peer {}: {}", peer, e);
            }
        }
    }
}

// Implement Serialize/Deserialize for Message
impl serde::Serialize for Message {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        match self {
            Message::NewBlock(block) => {
                let mut s = serializer.serialize_struct("Message", 2)?;
                s.serialize_field("type", "NewBlock")?;
                s.serialize_field("data", block)?;
                s.end()
            }
            Message::NewTransaction(tx) => {
                let mut s = serializer.serialize_struct("Message", 2)?;
                s.serialize_field("type", "NewTransaction")?;
                s.serialize_field("data", tx)?;
                s.end()
            }
            Message::RequestBlocks(height) => {
                let mut s = serializer.serialize_struct("Message", 2)?;
                s.serialize_field("type", "RequestBlocks")?;
                s.serialize_field("data", height)?;
                s.end()
            }
            Message::Blocks(blocks) => {
                let mut s = serializer.serialize_struct("Message", 2)?;
                s.serialize_field("type", "Blocks")?;
                s.serialize_field("data", blocks)?;
                s.end()
            }
            Message::Ping => {
                let mut s = serializer.serialize_struct("Message", 1)?;
                s.serialize_field("type", "Ping")?;
                s.end()
            }
            Message::Pong => {
                let mut s = serializer.serialize_struct("Message", 1)?;
                s.serialize_field("type", "Pong")?;
                s.end()
            }
        }
    }
}

impl<'de> serde::Deserialize<'de> for Message {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::de::{self, Visitor, MapAccess};
        use std::fmt;
        
        #[derive(serde::Deserialize)]
        #[serde(field_identifier, rename_all = "lowercase")]
        enum Field { Type, Data }
        
        struct MessageVisitor;
        
        impl<'de> Visitor<'de> for MessageVisitor {
            type Value = Message;
            
            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("struct Message")
            }
            
            fn visit_map<V>(self, mut map: V) -> std::result::Result<Message, V::Error>
            where
                V: MapAccess<'de>,
            {
                let mut msg_type: Option<String> = None;
                let mut data: Option<serde_json::Value> = None;
                
                while let Some(key) = map.next_key()? {
                    match key {
                        Field::Type => {
                            if msg_type.is_some() {
                                return Err(de::Error::duplicate_field("type"));
                            }
                            msg_type = Some(map.next_value()?);
                        }
                        Field::Data => {
                            if data.is_some() {
                                return Err(de::Error::duplicate_field("data"));
                            }
                            data = Some(map.next_value()?);
                        }
                    }
                }
                
                let msg_type = msg_type.ok_or_else(|| de::Error::missing_field("type"))?;
                
                match msg_type.as_str() {
                    "NewBlock" => {
                        let block: Block = serde_json::from_value(
                            data.ok_or_else(|| de::Error::missing_field("data"))?
                        ).map_err(de::Error::custom)?;
                        Ok(Message::NewBlock(block))
                    }
                    "NewTransaction" => {
                        let tx: Transaction = serde_json::from_value(
                            data.ok_or_else(|| de::Error::missing_field("data"))?
                        ).map_err(de::Error::custom)?;
                        Ok(Message::NewTransaction(tx))
                    }
                    "RequestBlocks" => {
                        let height: u64 = serde_json::from_value(
                            data.ok_or_else(|| de::Error::missing_field("data"))?
                        ).map_err(de::Error::custom)?;
                        Ok(Message::RequestBlocks(height))
                    }
                    "Blocks" => {
                        let blocks: Vec<Block> = serde_json::from_value(
                            data.ok_or_else(|| de::Error::missing_field("data"))?
                        ).map_err(de::Error::custom)?;
                        Ok(Message::Blocks(blocks))
                    }
                    "Ping" => Ok(Message::Ping),
                    "Pong" => Ok(Message::Pong),
                    _ => Err(de::Error::unknown_variant(&msg_type, &["NewBlock", "NewTransaction", "RequestBlocks", "Blocks", "Ping", "Pong"])),
                }
            }
        }
        
        deserializer.deserialize_map(MessageVisitor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_message_serialization() {
        use elysium_core::Block;
        let block = Block::new(1, "0".repeat(64), 1);
        let msg = Message::NewBlock(block);
        
        let bytes = msg.to_bytes().unwrap();
        let deserialized = Message::from_bytes(&bytes).unwrap();
        
        match (msg, deserialized) {
            (Message::NewBlock(_), Message::NewBlock(_)) => {}
            _ => panic!("Message type mismatch"),
        }
    }
}

