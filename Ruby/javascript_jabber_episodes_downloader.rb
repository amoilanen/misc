#Downloads all the mp3 episode recordings from JavaScript Jabber http://javascriptjabber.com
#Assumes that the system 'wget' command is available which is the case on Linux
#Episodes will be downloaded to /home/user/JSJabber
require 'net/http'

def get(uri)
  response = Net::HTTP.get_response(URI.parse(uri))
  if response.code == "301"
    response = Net::HTTP.get_response(URI.parse(response.header['location']))
  end
  response.body
end

def episode_links
  html = get("http://javascriptjabber.com/episode-guide/")
  links = html.scan(/href="(http:\/\/javascriptjabber.com\/\d+[^#]*?)"/)
  links.map{ |match| match[0] }.uniq
end

def mp3_download_link(episodeLink)
  html = get(episodeLink)
  html.match(/href="(.*?)".*title="Download"/)[1]
end

def download_episode(episodeLink)
  downloadLink = mp3_download_link(episodeLink)
  system("wget -P ~/JSJabber #{downloadLink}")
end

episodes = episode_links
count = 0

puts "Total #{episodes.length} to download..."
episodes.each do |episode|
  count += 1
  puts "Downloading episode #{count} of #{episodes.length}"
  download_episode(episode)
end