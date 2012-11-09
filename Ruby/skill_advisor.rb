#
# Automated skills advisor: based on the data available at careers.stackoverflow.com
# it generates the statistics which skills are most in demand and how they compare to
# what you know.
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
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

require 'net/http'

module Kernel

  alias_method :original_puts, :puts

  def puts(message)
      original_puts message
      STDOUT.flush
  end
end

def pathsFrom(pageHTML)
  paths = []
  pageHTML.scan(/<a class="title" href="(.*?)"/).each do |match|
    paths << match[0]
  end
  paths
end

def totalPagesFrom(pageHTML)
  pageHTML.match(/href=".*?" title="page (\d+) of (\d+)">\1<\/a>/) do |match|
     match[2].to_i
  end
end

def jobOpeningsPage(page = nil)
   url = "/jobs?searchTerm=&location="
   url += "&pg=#{page}" if !page.nil?
   resp = Net::HTTP.start('careers.stackoverflow.com') do |http|
     http.get(url)
   end
   resp.body
end

def openingSkills(path, knownSkills = [])
  knownSkills = knownSkills.map {|x| x.downcase}
  readSkills(readOpeningHTML(path), knownSkills)
end

def readOpeningHTML(path)
  resp = Net::HTTP.start('careers.stackoverflow.com') do |http|
    http.get(path)
  end
  html = resp.body
  
  #Workaround not to count "javascript" and "html" in the source of the html page itself
  startIndex = html.index('<div class="jobdetail">')
  endIndex = html.index('<p id="views"')
  html[startIndex, endIndex - startIndex]
end

def readSkills(openingHTML, knownSkills)
  openingHTML = openingHTML.downcase
  openingSkills = []
  openingSkills |= openingTags(openingHTML)  
  openingSkills |= mentionedOpeningSkills(openingHTML, knownSkills)
  openingSkills.uniq
end

def openingTags(openingHTML)
  tags = []
  openingHTML.scan(/<a class="post-tag" href="\/jobs\/tag\/(.*?)">\1<\/a>/) do |match|
    tags << match[0]
  end
  tags
end

def mentionedOpeningSkills(openingHTML, knownSkills)
  foundSkills = []
  knownSkills.each do |skill|
    foundSkills << skill if openingHTML.match(/ #{skill}[ ,\.]/)
  end
  foundSkills
end

def renderAndSaveToFile(skillsPopularity, openingsNumber, mySkills)
  html = renderToHTML(skillsPopularity, openingsNumber, mySkills)
  saveToFile("software_development_skills_assessment.html", html)
end

def saveToFile(file, content)
  File.open(file, "w") do |f|
    f.write(content)
  end
end

def renderToHTML(skillsPopularity, openingsNumber, mySkills)
  mySkills = mySkills.map {|x| x.downcase}
  html = <<multiline
<html>
<body>
<h1>Software Development Skills Assessment according to Data from careers.stackoverflow.com</h1>
<p>
<b>Skills that you listed as yours are put in bold.</b>
<b>Percents indicate in what share of job openings the skill was reqiured.</b>
Generated at #{Time.now} over #{openingsNumber} openings.
</p>
multiline
  skillsPopularity = hashValuesToPercent(skillsPopularity,  openingsNumber)

  skillsPopularity.sort_by { |k,v| v }.reverse.each do |k, v|
    v = "%.1f" % v 
    if !mySkills.index(k).nil?
       html += "<b>#{k}</b> - #{v}"
    else
       html += "#{k} - #{v}"
    end
    html += "<br/>\n"
  end
  html += <<multiline
    </body>
</html>
multiline
  html
end

def hashValuesToPercent(hash, total)
  hash.merge(hash) {|k,v| v.to_f / total * 100}
end

def openingPaths
  totalPages = totalPagesFrom(jobOpeningsPage)
  paths = []
  (1..totalPages).each do |i|
    puts "Reading openings from the page number #{i}"
    paths = paths | pathsFrom(jobOpeningsPage(i))
  end
  puts "Total #{paths.size} job openings available for analysis."
  paths
end

def skillsPreparedForAnalysis(paths, knownSkills)
  skills = []
  counter = 1
  paths.each do |path|
    puts "Reading job opening number #{counter} at #{path}"
    skills << openingSkills(path, knownSkills)
    counter += 1
  end
  skills
end

def skillsPopularity(skills)
  skillsPopularity = Hash.new(0)
  skills.each do |skillsForOpening|
    skillsForOpening.each do |skill|
      skillsPopularity[skill] += 1
    end
  end
  skillsPopularity
end

#######################
# Start of customizable script part
#######################

knownSkills = ["Ruby", "JRuby", "Python", "C", "Java", "Scala", "Erlang", "C#",  "Clojure", "Rails", "Silverlight", "Desktop", "Web", "Mobile",
"C++", "OO Design", "Linux", "STL", "JavaScript", "Android", "iOS", "iPhone", "iPad", "HTML", "CSS", "Ajax", "PHP",
"EtJS", "JQuery", "Objective-C", "Adobe InDesign", "Perl", "Python", "Shell", "Unix", "MySQL", "JUnit", "Test::Unit", "Cucumber", "Selenium",
"Machine Learning", "Mathematics", "Statistics", "PowerShell", "SuSe", "Ubuntu", "Redhat", "Win32", "COM", "MFC", "ATL", "GUI", "OOP"
]

mySkills = ["Java", "Ruby", "Pascal", "Scheme", "Common Lisp", "Clojure", "Basic", "Bash", "JavaScript", "JScript", "Transact-SQL", 
"Ant", "Perforce", "JIRA", "JUnit", "JMock", "EasyMock", "JBoss", "Eclipse", "SQL Server", "Vertica", "SWT", "EMF", "GEF", "WSDL", "BPEL",
"Hibernate", "JSF", "Seam", "JAAS", "Axis", "HtmlUnit", "JMeter", "BIRT", "Spring", "AutoIt", "WSH", "WiX", "Bouncy Castle", "JAXB",
"RSS", "Sinatra", "Rexml", "Rake", "Agile"
]

#######################
# End of customizable script part
#######################
knownSkills = knownSkills | mySkills

paths = openingPaths
skills = skillsPreparedForAnalysis(paths, knownSkills)
popularity = skillsPopularity(skills)

renderAndSaveToFile(popularity, paths.size, mySkills)