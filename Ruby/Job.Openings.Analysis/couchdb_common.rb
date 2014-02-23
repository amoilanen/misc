require 'rubygems'
require 'couchrest'
require 'couchrest_model'
 
server = CouchRest.new

class JobOpening < CouchRest::Model::Base
  use_database "job_openings"

  property :title
  property :employer
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

def store(title, employer, location, skills)
  opening = JobOpening.new({
    :title => title,
    :employer => employer,
    :location => location,
    :skills => skills
  })
  opening.save
end