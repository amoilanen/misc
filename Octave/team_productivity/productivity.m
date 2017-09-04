%
% max_pers_prod_i - maximum achievable personal productivity of i-th team member
% pers_prod_i - personal productivity of the i-th team member
% time_i - time current team member is in the team
% learning_time_i - time for the current team member to increase the productivity
%                   to half of their full productivity
% communication_cost_i - productivity lost due to external communication to team member i
% team_size - number of team members
% comm_cost_per_team_member_i - cost of communication per team member
% prod_i - full productivity of a team member achieved in a team
% team_prod - full team productivity
%
% pers_prod_i = max_pers_prod_i * time_i / (time_i + learning_time_i)
% communication_cost_i = comm_cost_per_team_member_i * team_size
% prod_i = (pers_prod_i + sum(pers_prod_i) / team_size) * (1 - communication_cost_i)
% team_prod = sum(prod_i)
%
% Compute average personal productivity, maximum personal productivity and minimal personal productivity

team_size = 10;

max_pers_prod_i = ones(team_size, 1);


time_i = zeros(team_size, 1);
common_learning_time = 30;
learning_time_i = common_learning_time * ones(team_size, 1);

communication_time_share_per_person = 0.05;
comm_cost_per_team_member_i = ones(team_size, 1) * communication_time_share_per_person;
communication_cost_i = comm_cost_per_team_member_i .* team_size;

team_perf_measurements = [];

%TODO: Compute the team productivity until it starts to converge to a constant value
time_range = 1:1000;
for t = time_range

  % Time tick
  time_i = time_i + 1;

  % Personal productivity improves up to a certain limit as the time in the team goes: learning benefits
  pers_prod_i = max_pers_prod_i .* time_i ./ (learning_time_i + time_i);

  % Every team member gets a productivity bonus from the average team performance: team work benefits
  team_prod_bonus = sum(pers_prod_i) / team_size;

  % Full productivity is slightly decreased by communication costs
  full_prod_i = (pers_prod_i + team_prod_bonus) .* max(1 - communication_cost_i, 0);

  %TODO: Scale values in average attainable personal productivities
  %printf("Moment in time %f\n", t);
  team_prod = sum(full_prod_i);
  max_full_prod = max(full_prod_i);
  min_full_prod = min(full_prod_i);
  avg_full_prod = mean(full_prod_i);
  sum_of_pers_prod = sum(pers_prod_i);

  time_i_measurements = [team_prod, max_full_prod, min_full_prod, avg_full_prod, sum_of_pers_prod];
  team_perf_measurements = [team_perf_measurements; time_i_measurements];
end

%TODO: Plot team productivity in average attainable personal productivities as a function of team size?

team_prod = figure(1);
plot(time_range, team_perf_measurements(:, 1), 'b-', team_perf_measurements(:, 5), 'r-');
legend('team productivity','mere sum of personal productivities');
title('Team vs. Personal Productivity');
hold on;
grid on;
print(team_prod,'-dpng','-color','team_prod.png');

personal_prod = figure(2);
plot(time_range, team_perf_measurements(:, 2), 'b-', team_perf_measurements(:, 3), 'r-', team_perf_measurements(:, 4), 'g-');
legend('max', 'min', 'average');
title('Personal Productivity Evolution');
hold on;
grid on;
print(personal_prod,'-dpng','-color','pers_prod.png');