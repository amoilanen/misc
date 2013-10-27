#
# This script can be run from the command line:
# 
# ruby album_creator.rb "https://www.facebook.com/photo.php?fbid=4828218591883&set=a.4828217071845.2189229.1489114124&type=3&l=9327ffc859"
# 
# where the URL of the first image in a public album is passed as a sole argument
#
require 'net/http'

$facebook_host = "www.facebook.com"
$template_location = 'template.html'

def html(url)
  resp = Net::HTTP.start($facebook_host, :use_ssl => true) do |http|
    http.get(url)
  end
  resp.body
end

def imageUrl(html)
  html.match(/href="([^ ]*?)\?dl=1"/).captures[0]
end

def nextUrl(html)
  html.match(/class="photoPageNextNav".*?href="https\:\/\/www\.facebook\.com(.*?)"/).captures[0]
end

def collectImages(url)
  visitedUrls = []
  images = []

  while not visitedUrls.include?(url) do
    pageHtml = html(url)

    images << imageUrl(pageHtml)
    visitedUrls << url
    url = nextUrl(pageHtml)
    sleep 1
  end
  images.uniq
end

def render(links)
  template = File.read($template_location)
  partialRendition = links.map do |link|
    "{image: \"#{link}\"}"
  end.join(",\n")
  rendition = template.gsub(/@images@/, partialRendition)

  File.open("gallery.html", "w") {|f| f.write(rendition)}
end

def readFirstImageUrl
  if ARGV[0].nil?
    raise "Provide the URL of the first photo in a public album as the first argument"
  end
  ARGV[0]
end

render(collectImages(readFirstImageUrl))