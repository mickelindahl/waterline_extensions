/**
 * Created by s057wl on 2016-07-18.
 */
'use strict'


const Hapi = require('hapi');
const Hapi_waterline=require('hapi-waterline');
const Sails_memory=require('sails-memory');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 12345
});

var config = {
    adapters: { // adapters declaration
        'memory': Sails_memory
    },
    connections: {
        'default': {adapter: 'memory'}
    },
    models: { // common models parameters, not override exist declaration inside models
        connection: 'default',
        migrate: 'create',
        schema: true
    },
    decorateServer: true, // decorate server by method - getModel
    path: '../../../models' // string or array of strings with paths to folders with models declarations
};

server.register([    {
        register:Hapi_waterline , // Database OMR
        options: config
    }]
    , function (err) {

        server.app.readyForTest = true;

    });

module.exports = server;
