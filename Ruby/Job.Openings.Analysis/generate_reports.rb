$LOAD_PATH.unshift File.dirname(__FILE__)
require 'couchdb_common'

def top_locations
  JobOpening.by_location.reduce.group_level(1).rows.sort do |x, y| 
    y.value <=> x.value
  end.map do |x|
    [x["key"], x["value"]]
  end
end

def top_skills
  JobOpening.by_skill.reduce.group_level(1).rows.sort do |x, y| 
    y.value <=> x.value
  end.map do |x|
    [x["key"], x["value"]]
  end
end

def top_locations_for_skill(skill)
  skills_and_locations = JobOpening.by_skill_and_location.reduce.group_level(2)

  locations_and_count = skills_and_locations.rows.select do |row| 
    row["key"][0] == skill
  end.map do |s|
    [s["key"][1], s["value"]]
  end.sort do |x, y|
    y[1] <=> x[1]
  end
end

#TODO: Generate the reports so that they can be viewed in a browser
puts "Top locations:"
p top_locations.take(2)
puts "Top skills:"
skills = top_skills.take(2)
p skills

skills.each do |skill|
  puts "Skill '#{skill[0]}'"
  p top_locations_for_skill(skill[0])
end