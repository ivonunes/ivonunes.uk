import { Application } from "@hotwired/stimulus"
import * as Turbo from "@hotwired/turbo"

import GithubReposController from "./controllers/github_repos_controller.js"
import NavigationController from "./controllers/navigation_controller.js"
import PageTransitionsController from "./controllers/page_transitions_controller.js"
import PhotoGridController from "./controllers/photo_grid_controller.js"

Turbo.start()

const application = Application.start()

application.register("github-repos", GithubReposController)
application.register("navigation", NavigationController)
application.register("page-transitions", PageTransitionsController)
application.register("photo-grid", PhotoGridController)
