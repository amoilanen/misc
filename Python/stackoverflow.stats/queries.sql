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
order by country_count desc;

#Most popular cities
select city, count(1) as city_count
from opening
group by city
order by city_count desc limit 50;

#What are the most popular languages
create table prog_language(name text);

insert into prog_language (name) values('c++');
insert into prog_language (name) values('python');
insert into prog_language (name) values('javascript');
insert into prog_language (name) values('clojure');
insert into prog_language (name) values('java');
insert into prog_language (name) values('refal');
insert into prog_language (name) values('dart');
insert into prog_language (name) values('ruby');
insert into prog_language (name) values('pascal');
insert into prog_language (name) values('actionscript');
insert into prog_language (name) values('prolog');
insert into prog_language (name) values('vbscript');
insert into prog_language (name) values('typescript');
insert into prog_language (name) values('ocaml');
insert into prog_language (name) values('lua');
insert into prog_language (name) values('erlang');
insert into prog_language (name) values('powershell');
insert into prog_language (name) values('groovy');
insert into prog_language (name) values('c#');
insert into prog_language (name) values('php');
insert into prog_language (name) values('perl');
insert into prog_language (name) values('scala');
insert into prog_language (name) values('scheme');
insert into prog_language (name) values('shell');
insert into prog_language (name) values('coffeescript');
insert into prog_language (name) values('c++');
insert into prog_language (name) values('go');
insert into prog_language (name) values('objectivec');
insert into prog_language (name) values('haskell');
insert into prog_language (name) values('c');
insert into prog_language (name) values('ruby');

select
  count(1) as language_count,
  T.language
from opening_skill
join (select
       skill.id as id,
       skill.name as language
      from skill
      join prog_language
      on skill.name = prog_language.name
     ) T
on opening_skill.skill_id == T.id
group by T.language
order by language_count desc;

#Merging skill aliases with skills. html skills
select
  count(1) as skill_count,
  skill.name
from opening_skill
join skill
on opening_skill.skill_id == skill.id
where skill.name like '%html%'
group by skill.name
order by skill_count desc;