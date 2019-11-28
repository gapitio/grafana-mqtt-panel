import { LiveData } from './live_data';
import { loadPluginCss } from 'grafana/app/plugins/sdk';

loadPluginCss({
    dark: 'plugins/gapit-live_data-panel/styles/dark.css',
    light: 'plugins/grafana-live-data/styles/light.css',
});

export { LiveData as PanelCtrl };
