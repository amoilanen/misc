$LOAD_PATH.unshift File.dirname(__FILE__)
require 'couchdb_common'
require 'json'
require 'uri'

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

$google_maps_entries_per_layer_limit = 100

def generate_data_for_google_maps(name, map_data)
  slices = map_data.each_slice($google_maps_entries_per_layer_limit).to_a
  slices.each.with_index(0) do |slice, idx|
    File.open("#{name}_google_maps_#{idx}.csv", 'w') do |f|
    f.puts 'Location, Openings'
      slice.each do |location|
        f.puts location[0].to_s + "," + location[1].to_s
      end
    end
  end
end

def render(template, data)
  data.keys.inject(template) do |current_template, key|
    current_template.gsub(Regexp.new(key), data[key].to_json)
  end
end

def render_report(name, title, data)
  template = File.read('report_template.html')
  categories = data.map{|x| x.first}
  axis_data = data.map{|x| x.last}

  rendered = render(template, {
    '@title@' => title,
    '@categories@' => categories,
    '@data@' => axis_data
  })
  File.open("#{name}_#{title}_report.html", "w") do |f|
    f.write(rendered)
  end
end

#Rendering the reports
puts "All locations..."
all_locations = top_locations
render_report("alllocations", "openings", all_locations)
generate_data_for_google_maps("all_skills", all_locations)

puts "Top locations..."
top10locations = all_locations.take(10)
render_report("top10locations", "openings", top10locations)

puts "Top skills..."
top10skills = top_skills.take(10)
render_report("top10skills", "openings", top10skills)

puts "Top locations for top 10 skills"
top10skills.each do |skill|
  puts "Skill '#{skill[0]}'"
  top_locations_for_current_skill = top_locations_for_skill(skill[0])
  render_report("top10locationsfor#{skill[0]}", "openings", top_locations_for_current_skill.take(10))
  generate_data_for_google_maps(skill[0], top_locations_for_current_skill)
end