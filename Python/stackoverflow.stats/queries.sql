#What are most popular skills
select name, count(1) as skill_count
from skill
join
opening_skill
on skill.id == opening_skill.skill_id
group by name
order by skill_count desc;

#What are the countries with most openings. Individual states are like separate countries.
select country, count(1) as country_count
from opening
group by country
order by country_count desc limit 20;