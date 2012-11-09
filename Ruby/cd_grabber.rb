#
# CD Grabber. A simple Ruby script that simplifies converting your music to MP3 provided that you
# have Lame http://lame.sourceforge.net/ installed.
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
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>

# How to use:
#1. Getting track information from file
#ruby cd_grabber.rb --from "source" --to "destination/music" --infofromfile "tracks.txt"
#2. Getting track information from Web (information found on Amazon will be used)
#ruby cd_grabber.rb --from "source" --to "destination/music" --infofromweb --artist "Johnny Cash" --album "At Folsom Prison"
#3. Grabbing the tracks with the default names
#ruby cd_grabber.rb --from "source" --to "destination/music" --artist "Johnny Cash" --album "At Folsom Prison"
#4. Including the original WAV files with the grabbed files
#ruby cd_grabber.rb --from "source" --to "destination/music" --infofromweb --artist "Johnny Cash" --album "At Folsom Prison" --includewav

require 'fileutils'
require 'find'
require 'pathname'
require 'trollop'
require 'net/http'

def readTrackInformationFromFile(trackList)
  File.open(trackList, "r") do |f|
    lines = f.readlines.map {|line| line.strip}
    [lines.shift, lines.shift, lines]
  end
end

def getHTML(url)
  resp = Net::HTTP.start('www.amazon.com') do |http|
    http.get(url)
  end
  resp.body
end

def prepareSearchTerms(searchTerms)
  searchTerms.gsub(/\s+/, "+")
end

def findFirstProductURL(searchTerms)
    searchTerms = prepareSearchTerms(searchTerms)
    searchUrl = "/s/ref=nb_sb_noss?url=search-alias%3Dpopular&field-keywords=#{searchTerms}&x=0&y=0"
    pageHTML = getHTML(searchUrl)
    foundLink = pageHTML.scan(/<a class="title" href="http:\/\/www.amazon.com(.*?)"/)[0]
    raise "Unknown record, cannot find anything for \"#{searchTerms}\"" if foundLink.nil?
    foundLink[0]
end

def tracksFromProduct(productURL)
  pageHTML = getHTML(productURL)
  tracks = []
  pageHTML.scan(/<td class="titleCol">.*?<a href=".*?">(.*)<\/a><\/td>/).each do |match|
    tracks << match[0]
  end
  tracks
end

def listOfTracksFromFirstFoundProduct(searchTerms)
  tracksFromProduct(findFirstProductURL(searchTerms))
end

def encodeToMP3(originalPath, destination, newName, includeWav) 
   system("lame -V0 \"#{originalPath}\" \"#{File.join(destination, newName)}.mp3\"")
   FileUtils.cp(originalPath, "#{File.join(destination, "wav", newName)}.wav") if includeWav
end

def grabCD(cdOrigin, cdDestination, includeWav, artist, album, trackNames)
   trackNumber = 1
   tracks = []
   sortedTracks = Find.find(cdOrigin).select {|f| !File.directory?(f) && File.extname(f).eql?(".wav")}
           .sort_by { |f| f.match(/\d+\./)[0].to_i}
   sortedTracks.each do |filePath| 	   
       trackName = !trackNames.empty? ? trackNames.shift : "Unknown"
       tracks << {:originalPath => filePath, :newName => "#{"%02d" % trackNumber} #{trackName}"}
       trackNumber += 1
    end

    fullCDDestination = File.join(cdDestination, artist, album)
    FileUtils.mkdir_p(fullCDDestination)
    FileUtils.mkdir_p(File.join(fullCDDestination, "wav")) if includeWav

    tracks.each do |track|
        encodeToMP3(track[:originalPath], fullCDDestination, track[:newName], includeWav)
    end
end

opts = Trollop::options do
  opt :from, "From where grab the tracks", :type => :string, :required => true
  opt :to, "To where grab the tracks", :type => :string, :required => true
  opt :infofromfile, "File with information about the tracks", :type => :string
  opt :infofromweb,  "Ignore track_list, fetch information from Web"
  opt :artist, "Full artist name", :type => :string
  opt :album, "Album name", :type => :string
  opt :includewav, "Include original 'wav' files"
end

cdOrigin = opts[:from]
cdDestination = opts[:to]
infoFile = opts[:infofromfile]
infoFromWeb = opts[:infofromweb]
artist = opts[:artist]
album = opts[:album]
includeWav = opts[:includewav]
tracks = []

if infoFromWeb
   raise "When getting information from Web, specify artist and album" if !artist || !album
   puts "Getting track information from Web..."
   searchTerms = "#{artist} #{album}"
   tracks = listOfTracksFromFirstFoundProduct(searchTerms)
elsif infoFile
   puts "Getting track information from \"#{infoFile}\"..."
   artist, album, tracks = readTrackInformationFromFile(infoFile)
else
   raise "When getting information from Web, specify artist and album" if !artist || !album
   puts "No track information available..."
end
grabCD(cdOrigin, cdDestination, includeWav, artist, album, tracks)