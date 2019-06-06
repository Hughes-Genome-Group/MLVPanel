import "../../css/jquery-ui-bootstrap/jquery-ui-1.10.3.custom.css";
import "../../css/fa-5.5.0/all.css";
import "../../css/mlv_panel.css";
import "../vendor/jquery-ui.min.js";
import "../vendor/jquery-ui-fixes.js";
import {MLVPanel} from "../panel.js";
import {MLVTrack,MLVBedTrack,MLVBigBedTrack} from "../tracks.js";
import {FeatureSource} from "../feature.js"
window.MLVPanel = MLVPanel;
window.MLVTrack= MLVTrack;
window.MLVBedTrack=MLVBedTrack;
window.MLVBigBedTrack=MLVBigBedTrack;
window.FeatureSource=FeatureSource;
window.$=$;
window.jQuery=$;