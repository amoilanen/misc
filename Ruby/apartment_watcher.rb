#
# Script that monitors new apartments that are available for rent and sends a notification
# in case something new shows up. The script can be scheduled to run, say, each 30 minutes.
#
# Copyright (c) 2011 Anton Ivanov anton.al.ivanov(no spam)gmail.com
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

require 'net/http'
require 'net/smtp'

#E-mail settings
$from = "gmail-email"
$password="gmail-password"
$to="gmail-email"

#Pararius search settings
$cityName='amsterdam'
$radius=10
$minPrice=0
$maxPrice=1000
$furnished=1

$scriptDirectory = File.expand_path(File.dirname(__FILE__))
$storedLinksFile = File.join($scriptDirectory, "stored_apartments.txt")
$firstURL="/english/clientQuickSearch.php?posted=yes&houseSort=0&city_name=#{$cityName}&radius=#{$radius}&minPrice=#{$minPrice}&maxPrice=#{$maxPrice}&furnished=#{$furnished}&size_m2=0&NroOfRooms=0&submit=Search"

def readCurrentLinks
  listings = []
  url = $firstURL
  
  begin
    sleep 1
    html = pageForURL(url)
    url = nil
    listings << apartmentLinksForPage(html)
    nextPageURL = nextPageURLForPage(html)
    url = nextPageURL if !nextPageURL.nil?
  end while !url.nil?
  listings.flatten
end

def pageForURL(url)
  resp = Net::HTTP.start('www.pararius.com') do |http|
    http.get(url)
  end
  resp.body
end

def apartmentLinksForPage(html)
  listings = []
  html.scan(/<div class="titlestreet">.*?href="(.*?)"/) do |match|
    listings << match[0]
  end
  listings
end

def nextPageURLForPage(html)
  nextPageURL = nil
  html.scan(/<a href="(.*?)".*?blue-arrow-btn-gray\.gif"/) do |match|
      nextPageURL = match[0]
  end
  nextPageURL
end

def readOldLinks
    File.open($storedLinksFile, "w+") if !File.exist? $storedLinksFile
    File.open($storedLinksFile, 'r') do |f| 
        f.readlines.map {|line| line.delete "\n"}
    end
end

def storeLinks(links)
    File.open($storedLinksFile, 'w') do |f| 
        links.each {|link| f.puts(link)}
    end
end

def sendMail(body)
  message = <<msg
From: #{$from}
To: #{$to}
Subject: New Apartments For Rent From pararius.com For #{Time.now}

#{body}
msg

  smtp = Net::SMTP.new 'smtp.gmail.com', 587
  smtp.enable_starttls
  smtp.start('gmail.com', $from, $password, :login) do
      smtp.send_message(message, $from, $to)
  end
end

currentLinks = readCurrentLinks
oldLinks = readOldLinks
newLinks = currentLinks - oldLinks

if !newLinks.empty?
    renderedLinks = newLinks.join("\n")
    sendMail(renderedLinks)
end
storeLinks(currentLinks)