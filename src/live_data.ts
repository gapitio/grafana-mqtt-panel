import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import * as _ from 'lodash';
import kbn from 'grafana/app/core/utils/kbn';
// @ts-ignore
import { connect } from 'mqtt';

import * as Highcharts from 'highcharts';
require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/solid-gauge')(Highcharts);

class LiveData extends MetricsPanelCtrl {
    static templateUrl = 'module.html';
    $rootScope: any;
    unitFormats: any;
    value: any;
    data: any;
    mqttClient: any;
    subscribed: any;
    mqttConnection: any;
    format: any;
    gauge: any;

    /** @ngInject */
    constructor($scope: any, $injector: any, $rootScope: any) {
        super($scope, $injector);
        this.$rootScope = $rootScope;
        this.subscribed = [];
        this.value = 'Waiting for response';
        this.mqttConnection = {
            message: '',
            status: 'Connect'
        };

        this.format = 'locale';
        const PANEL_DEFAULT = {
            mqtt: {
                mode: 'Recieve',
                login: {
                    hostname: '',
                    port: 9001
                },
                topic: 'data',
                publish: {
                    value: 'Hello'
                },
                show: true
            },
            design: {
                type: 'Text'
            }
        };

        _.defaults(this.panel, PANEL_DEFAULT);

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-initialized', this.initialize.bind(this));
        this.events.on('render', this.onRender.bind(this));
    }

    onRender() {
        if (this.panel.design.type == 'Gauge') {
            if (this.gauge) {
                this.gauge.reflow();
            } else {
                this.createGauge();
            }
        }
    }

    initialize() {
        this.updateMQTTClient();
        this.createGauge();
    }

    createGauge() {
        if (!this.gauge) {
            const PANEL_ELT = document.getElementById(`panel-${this.panel.id}`);
            if (PANEL_ELT) {
                const GAUGE_ELT: any = PANEL_ELT.getElementsByClassName('live-data-value-gauge')[0];
                if (GAUGE_ELT) {
                    const HIGHCHARTS: any = Highcharts;

                    this.gauge = HIGHCHARTS.chart(
                        HIGHCHARTS.merge(
                            {
                                chart: {
                                    renderTo: GAUGE_ELT,
                                    type: 'solidgauge',
                                    backgroundColor: 'transparent'
                                },

                                title: null,


                                exporting: {
                                    enabled: false
                                },

                                tooltip: {
                                    enabled: false
                                },

                                // the value axis
                                yAxis: {
                                    stops: [
                                        [0.1, '#55BF3B'], // green
                                        [0.5, '#DDDF0D'], // yellow
                                        [0.9, '#DF5353'] // red
                                    ],
                                    lineWidth: 0,
                                    tickWidth: 0,
                                    minorTickInterval: null,
                                    tickAmount: 2,
                                    labels: {
                                        y: 16
                                    }
                                },

                                credits: {
                                    enabled: false
                                },

                                pane: {
                                    background: [{
                                        borderWidth: 0,
                                        backgroundColor: 'transparent'
                                    }]
                                },

                                plotOptions: {
                                    solidgauge: {
                                        dataLabels: {
                                            y: -20,
                                            borderWidth: 0,
                                            useHTML: true
                                        }
                                    }
                                }
                            },
                            {
                                yAxis: {
                                    min: 0,
                                    max: 50,
                                    title: {
                                        text: null
                                    },
                                    labels: {
                                        enabled: false
                                    }
                                },

                                series: [
                                    {
                                        name: null,
                                        data: [0],
                                        dataLabels: {
                                            format:
                                                '<div style="text-align:center"><span>{y:.1f}</span><br/></div>'
                                        }
                                    }
                                ]
                            }
                        )
                    );
                }
            }
        }
    }

    getVariableValue(variable: string) {
        if (typeof(variable) == 'string' && variable != '' && variable.charAt(0) == '$') {
            const DASHBOARD_VARIABLES = this.templateSrv.variables;
            if (DASHBOARD_VARIABLES.length > 0) {
                const FILTERED_VARIABLES = DASHBOARD_VARIABLES.filter((x: any) => x.name == variable.substr(1))
                if (FILTERED_VARIABLES.length > 0) {
                    return FILTERED_VARIABLES[0].current.value;
                }
            }
        }
        return variable;
    }

    updateMQTTClient() {
        console.log(this.templateSrv.variables.filter((x: any) => x.name == "test")[0].current.value);
        const PANEL_ELT = document.getElementById(`panel-${this.panel.id}`);

        if (this.mqttClient) {
            this.mqttClient.end();
        }

        const MQTT_CONVERTED_DICT = {
            hostname: this.getVariableValue(this.panel.mqtt.login.hostname),
            port: this.getVariableValue(this.panel.mqtt.login.port),
            username: this.getVariableValue(this.panel.mqtt.login.username),
            password: this.getVariableValue(this.panel.mqtt.login.password),
            topic: this.getVariableValue(this.panel.mqtt.topic)
        };
        console.log(MQTT_CONVERTED_DICT);

        const MQTT_LOGIN_DICT = {
            hostname: this.panel.mqtt.login.hostname,
            port: this.panel.mqtt.login.port,
            username: this.panel.mqtt.login.username,
            password: this.panel.mqtt.login.password,
        };

        const SET_CONNECTION_STATUS = (
            message: any,
            hostname: any,
            port: any,
            topic: any,
            status: any
        ) => {
            this.mqttConnection.message = `${message} ${hostname}:${port}/${topic}`;
            this.mqttConnection.status = status;

            const MQTT_CONNECTION_ELT: any = PANEL_ELT
                ? PANEL_ELT.getElementsByClassName('mqtt-connection')
                    ? PANEL_ELT.getElementsByClassName('mqtt-connection')
                        .length > 0
                        ? PANEL_ELT.getElementsByClassName('mqtt-connection')[0]
                        : null
                    : null
                : null;
            if (MQTT_CONNECTION_ELT) {
                MQTT_CONNECTION_ELT.textContent = this.mqttConnection.message;
            }

            const MQTT_CONNECT_ELT: any = PANEL_ELT
                ? PANEL_ELT.getElementsByClassName('connect-button')
                    ? PANEL_ELT.getElementsByClassName('connect-button')
                        .length > 0
                        ? PANEL_ELT.getElementsByClassName('connect-button')[0]
                        : null
                    : null
                : null;
            if (MQTT_CONNECT_ELT) {
                MQTT_CONNECT_ELT.textContent = this.mqttConnection.status;
            }
        };

        if (
            ![
                ...Object.values(MQTT_LOGIN_DICT),
                this.panel.mqtt.topic
            ].includes('')
        ) {
            SET_CONNECTION_STATUS(
                'Preparing to connect to',
                MQTT_LOGIN_DICT.hostname,
                MQTT_LOGIN_DICT.port,
                this.panel.mqtt.topic,
                'Connecting'
            );

            this.mqttClient = connect(MQTT_LOGIN_DICT);

            SET_CONNECTION_STATUS(
                'Connecting to',
                this.mqttClient.options.hostname,
                this.mqttClient.options.port,
                this.panel.mqtt.topic,
                'Connecting'
            );

            this.mqttClient.on('connect', () => {
                this.mqttClient.subscribe(this.panel.mqtt.topic, () => {
                    const TOPICS: any = Object.values(
                        this.mqttClient.messageIdToTopic
                    )[0];
                    if (TOPICS && TOPICS.length > 0) {
                        this.mqttClient.topic = TOPICS[0];
                    }
                    SET_CONNECTION_STATUS(
                        'Connected to',
                        this.mqttClient.options.hostname,
                        this.mqttClient.options.port,
                        this.mqttClient.topic,
                        'Connected'
                    );
                });
            });

            this.mqttClient.on('error', (err: any) =>
                SET_CONNECTION_STATUS(
                    'Failed connecting to',
                    this.mqttClient.options.hostname,
                    this.mqttClient.options.port,
                    this.mqttClient.topic || this.panel.mqtt.topic,
                    'Failed'
                )
            );
            this.mqttClient.stream.on('error', (err: any) =>
                SET_CONNECTION_STATUS(
                    'Failed connecting to',
                    this.mqttClient.options.hostname,
                    this.mqttClient.options.port,
                    this.mqttClient.topic || this.panel.mqtt.topic,
                    'Failed'
                )
            );

            this.mqttClient.on('message', (topic: any, message: any) => {
                this.data = message.toString();
                this.value = this.formatValue(this.data);
                if (this.panel.design.type == 'Text' && PANEL_ELT) {
                    const VALUE_ELTS = PANEL_ELT.getElementsByClassName("live-data-value");
                    if (VALUE_ELTS && VALUE_ELTS.length > 0) {
                        VALUE_ELTS[0].textContent = this.value;
                    }
                }
                if (!isNaN(this.value)) {
                    if (this.panel.design.type == 'Gauge' && this.gauge && this.gauge.series) {
                        this.gauge.series[0].points[0].update(
                            parseFloat(this.value)
                        );
                    }
                }
            });
        }
    }

    onPublish() {
        if (
            this.mqttClient &&
            this.mqttClient.connected &&
            this.panel.mqtt.topic != ''
        ) {
            this.mqttClient.publish(
                this.panel.mqtt.topic,
                this.panel.mqtt.publish.value
            );
        }
    }

    onInitEditMode() {
        this.addEditorTab(
            'Options',
            'public/plugins/gapit-live_data-panel/editor.html',
            2
        );
        this.unitFormats = kbn.getUnitFormats();
    }

    setUnitFormat(subItem: any) {
        this.panel.format = subItem.value;
        this.value = this.formatValue(this.data);
        this.render();
    }

    getDecimalsForValue(value: any) {
        value = Number(value);
        if (_.isNumber(this.panel.decimals)) {
            return { decimals: this.panel.decimals, scaledDecimals: null };
        }

        const delta = value / 2;
        let dec = -Math.floor(Math.log(delta) / Math.LN10);

        const magn = Math.pow(10, -dec);
        const norm = delta / magn; // norm is between 1.0 and 10.0
        let size;

        if (norm < 1.5) {
            size = 1;
        } else if (norm < 3) {
            size = 2;
            // special case for 2.5, requires an extra decimal
            if (norm > 2.25) {
                size = 2.5;
                ++dec;
            }
        } else if (norm < 7.5) {
            size = 5;
        } else {
            size = 10;
        }

        size *= magn;

        // reduce starting decimals if not needed
        if (Math.floor(value) === value) {
            dec = 0;
        }

        const result = {
            decimals: 0,
            scaledDecimals: 0
        };
        result.decimals = Math.max(0, dec);
        result.scaledDecimals =
            result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

        return result;
    }

    formatValue(value: any) {
        const decimalInfo = this.getDecimalsForValue(value);
        const formatFunc = kbn.valueFormats[this.panel.format];
        if (formatFunc && !isNaN(Number(value))) {
            return formatFunc(
                value,
                decimalInfo.decimals,
                decimalInfo.scaledDecimals
            );
        }
        return value;
    }
}

export { LiveData, LiveData as MetricsPanelCtrl };
