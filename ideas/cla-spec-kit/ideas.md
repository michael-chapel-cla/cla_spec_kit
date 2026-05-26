I want to create an application spec kit similar to github speckit: https://github.com/github/spec-kit
Users of this app will be using GitHub copilot
Users of this app should be able to start up a devcontainer and run the app agents in the container using GitHub copilot
The agents to create is a /design which will take a spefication design from /ideas which will include a app name like /ideas/app-repo-name/ideas.md and possibly figma screen shots. 
From /ideas/app-repo-name the agent will generate a /requirements/app-repo-name and include all the different files that you find in /requirements/expample
Then the agent /plan will take the requirements and generate a plan of what needs to be done to build the app into the directory /plans/app-repo-name
Then the agent /create will take the plan and generate the code into the directory /repos/app-repo-name and uses the context files from the /specs directory and it will always build the app tarting with the template in the /templates directory, framework-nodejs-starter-kit for a backend API app service, and framework-react-starter-kit for a frontend app service.
Make sure you make a complete set of commands to support this spec kit similar to the github speckit.
Also in the /repos/app-repo-name directory, also use the /helm directory to deploy the app to a Kubernetes cluster.
This is made to be the easy button for this organization to get started with a new app using the stack that the templates and specs are built on.
Only configure claude to build THIS app, nothing else. The rest will be built using github copilot.
