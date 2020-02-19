import { Main } from './main';
import { loadPluginCss } from 'grafana/app/plugins/sdk';

loadPluginCss({
    dark: 'plugins/gapit-mqtt-panel/styles/dark.css',
    light: 'plugins/gapit-mqtt-panel/styles/light.css',
});

export { Main as PanelCtrl };
