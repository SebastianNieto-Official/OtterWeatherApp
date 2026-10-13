import { initRouter } from "./router.js";
import { initDetailsView } from "./details-view.js";
import { initHomeView } from "./home-view.js";
import { initOverlayController } from "./overlay-controller.js";
import { initTheme } from "./theme.js";
import * as app from "./app.js";

initRouter();
initDetailsView();
initHomeView();
initOverlayController();
initTheme();
app.init();
