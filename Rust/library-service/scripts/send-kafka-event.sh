#!/bin/bash
# Script to send test Kafka events
# Usage: ./scripts/send-kafka-event.sh <event-type> [args]

set -e

KAFKA_CONTAINER="library-kafka"
TOPIC="book-events"

if [ -z "$1" ]; then
    echo "Usage: $0 <event-type> [args]"
    echo "Event types: book_added, book_loaned, book_returned, book_removed"
    exit 1
fi

EVENT_TYPE=$1

case $EVENT_TYPE in
    book_added)
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
            echo "Usage: $0 book_added <isbn> <title> <author> <genre> [published_year] [total_copies]"
            exit 1
        fi
        ISBN=$2
        TITLE=$3
        AUTHOR=$4
        GENRE=$5
        PUBLISHED_YEAR=${6:-2023}
        TOTAL_COPIES=${7:-1}
        
        EVENT=$(cat <<EOF
{
  "event_type": "book_added",
  "isbn": "$ISBN",
  "title": "$TITLE",
  "author": "$AUTHOR",
  "genre": "$GENRE",
  "published_year": $PUBLISHED_YEAR,
  "total_copies": $TOTAL_COPIES
}
EOF
)
        ;;
    book_loaned)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 book_loaned <book_id> <user_id>"
            exit 1
        fi
        BOOK_ID=$2
        USER_ID=$3
        
        EVENT=$(cat <<EOF
{
  "event_type": "book_loaned",
  "book_id": "$BOOK_ID",
  "user_id": "$USER_ID"
}
EOF
)
        ;;
    book_returned)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 book_returned <book_id> <user_id>"
            exit 1
        fi
        BOOK_ID=$2
        USER_ID=$3
        
        EVENT=$(cat <<EOF
{
  "event_type": "book_returned",
  "book_id": "$BOOK_ID",
  "user_id": "$USER_ID"
}
EOF
)
        ;;
    book_removed)
        if [ -z "$2" ]; then
            echo "Usage: $0 book_removed <book_id>"
            exit 1
        fi
        BOOK_ID=$2
        
        EVENT=$(cat <<EOF
{
  "event_type": "book_removed",
  "book_id": "$BOOK_ID"
}
EOF
)
        ;;
    *)
        echo "Unknown event type: $EVENT_TYPE"
        exit 1
        ;;
esac

echo "Sending event to Kafka topic $TOPIC:"
echo "$EVENT" | jq '.'

echo "$EVENT" | docker exec -i $KAFKA_CONTAINER kafka-console-producer \
    --bootstrap-server localhost:9092 \
    --topic $TOPIC

echo "Event sent successfully!"

