$LOAD_PATH.unshift File.dirname(__FILE__)
require 'net/http'
require 'couchdb_common'

def get(uri)
  response = Net::HTTP.get_response(URI.parse(uri))
  if response.code == "301"
    response = Net::HTTP.get_response(URI.parse(response.header['location']))
  end
  response.body
end

def openings(page_html)
  openings = page_html.scan(/(<a\s+class="job\-link".*?)<p\s+class="posted\s+bottom"/m)

  openings.map do |opening|
    opening = opening[0]
    title = opening.match(/<a\s+class="job\-link".*?title="(.*?)">/m)[1]
    employer = opening.match(/<span\s+class="employer">(.*?)<\/span>/m)[1].strip
    location = opening.match(/<p\s+class="location">.*?<\/span>.*?;([a-zA-Z\s]+)/m)[1].strip
    skills = opening.scan(/href="\/jobs\/tag\/(.*?)"/).map {|skill| skill[0]}
    {:title => title, :employer => employer, :location => location, :skills => skills}
  end
end

def total_pages(page_html)
  page_number = page_html.match(/page \d+ of (\d+)/)[1]
  page_number.to_i
end

page_url = "http://careers.stackoverflow.com/jobs"
page_html = get(page_url)
page_openings = openings(page_html)
pages = total_pages(page_html)

all_openings = (2..pages).inject(page_openings) do |openings, current_page_number|
  current_page_url = "#{page_url}?pg=#{current_page_number}"
  current_page_html = get(current_page_url)
  current_page_openings = openings(current_page_html)
  openings.concat(current_page_openings)
end

all_openings.each do |opening|
  store(opening[:title], opening[:employer], opening[:location], opening[:skills])
end

"Fetched #{all_openings.length} openings"