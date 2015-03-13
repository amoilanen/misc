require 'rubygems'
require 'couchrest'
require 'couchrest_model'
require 'json'
 
server = CouchRest.new

class JobOpening < CouchRest::Model::Base
  use_database "job_openings"

  property :title
  property :location
  property :skills

  design do
    view :by_title
    view :by_location,
      :map =>
        "function(doc) {
          emit(doc.location, 1);
        }",
      :reduce =>
        "function(keys, values, rereduce) {
          return sum(values);
        }"
    view :by_skill,
      :map =>
        "function(doc) {
          doc.skills.forEach(function(skill) {
            emit(skill, 1);
          });
        }",
      :reduce =>
        "function(keys, values, rereduce) {
          return sum(values);
        }"
    view :by_skill_and_location,
      :map =>
        "function(doc) {
          doc.skills.forEach(function(skill) {
            emit([skill, doc.location], 1);
          });
        }",
      :reduce =>
        "function(keys, values, rereduce) {
          return sum(values);
        }"
  end
end

def store(location, skills)
  opening = JobOpening.new({
    :title => "job opening",
    :location => location,
    :skills => skills
  })
  opening.save
end

store("Amsterdam", ["javascript", "nodejs", "grunt", "karma"]);
store("Amsterdam", ["javascript", "nodejs", "grunt"]);
store("Amsterdam", ["javascript", "nodejs"]);
store("Amsterdam", ["javascript"]);
store("Berlin", ["javascript", "nodejs", "grunt", "karma"]);
store("Berlin", ["javascript", "nodejs", "grunt"]);
store("Berlin", ["javascript", "nodejs"]);
store("Paris", ["javascript", "nodejs", "grunt", "karma"]);
store("Paris", ["javascript", "nodejs", "grunt"]);
store("London", ["javascript", "nodejs", "grunt", "karma"]);

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

puts "Top locations:"
p top_locations.take(2)
puts "Top skills:"
skills = top_skills.take(2)
p skills

skills.each do |skill|
  puts "Skill '#{skill[0]}'"
  p top_locations_for_skill(skill[0])
end