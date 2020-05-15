# Grafana MQTT panel

- [Grafana MQTT panel](#grafana-mqtt-panel)
  - [MQTT panel](#mqtt-panel)
    - [Some use cases](#some-use-cases)
  - [Tested brokers](#tested-brokers)
  - [Setting up the plugin](#setting-up-the-plugin)
    - [Building the plugin](#building-the-plugin)
    - [Developing the plugin](#developing-the-plugin)

## MQTT panel

This plugin communicates with a MQTT broker through websocket to transmit and receive data.

The panels have 2 types of design, text and gauge.
NB! The unit is not displayed in gauge. Preferred unit for gauge is "short"

It's used to get real time data from equipment, but can be used with anything that can send data to an MQTT broker.

### Some use cases

- Python script that monitors the temperature of the CPU
- Javascript (website) that gets the amount of new visitors

## Tested brokers

- Mosquitto 1.6.9 [How to install mosquitto with websocket (replace 1.4.10 with 1.6.9)](https://gist.github.com/smoofit/dafa493aec8d41ea057370dbfde3f3fc)

## Setting up the plugin

### Building the plugin

First, install dependencies:

```BASH
yarn
```

To build the plugin run:

```BASH
yarn build
```

### Developing the plugin

First, install dependencies:

```BASH
yarn
```

To work with the plugin run:

```BASH
yarn dev
```

or

```BASH
yarn watch
```

Watch will watch for any changes and rebuild the files when it sees any changes to the files
