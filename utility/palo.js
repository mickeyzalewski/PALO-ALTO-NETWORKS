"use strict";

const request = require('request');
const utility = require('./utility');

exports.getCurrentDestination = function(entryName, paloIp, paloAdmin, paloPw, callback){
    this.getPaloKey(paloIp, paloAdmin, paloPw, function(err, paloKey){
        const xpath = "/config/devices/entry[@name='localhost.localdomain']/vsys/entry[@name='vsys1']/rulebase/nat/rules/entry[@name='" + entryName + "']/destination-translation/translated-address";

        const url = 'https://' + paloIp + '/api/?type=config&action=show&key=' + paloKey + '&xpath=' + xpath;

        const r = request.post(url, function (err, httpResponse, body) {
            if (err) {
                callback(err, err.stack);
            }else{
                const strBody = body.toString();
                if(strBody.includes('No such node')){
                    callback(null, 'rule not found');
                }else{
                    utility.parseXml(body, function(err, xmlResponse){
                        callback(null, xmlResponse);
                    });
                }
            }
        });
    })
};

exports.getPaloKey = function(paloIp, paloAdmin, paloPw, callback){
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    let paloKey = '';

    request('https://' + paloIp.toString() + '/api/?type=keygen&user=' + paloAdmin + '&password=' + paloPw, function (error, response, body) {
        if (!error) {
            paloKey = body.toString();
            paloKey = paloKey.replace("<response status = 'success'><result><key>", "");
            paloKey = paloKey.replace("</key></result></response>", "");
            callback(null, paloKey);
        } else{
            callback(error, err.stack);
        }
    });
};

exports.commitConfig = function(paloIp, paloAdmin, paloPw, callback){
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    this.getPaloKey(paloIp, paloAdmin, paloPw, function(err, paloKey){
        request.get('https://' + paloIp + '/api/?type=commit&cmd=<commit></commit>&key=' + paloKey)
            .on('data', function(data){
                callback(null, 'initiated commit')
            })
            .on('error', function(error){
                callback(error, error.stack);
            })
    })

};

exports.updateNATRule = function(entryName, paloIp, paloAdmin, paloPw, ip, callback){
    this.getPaloKey(paloIp, paloAdmin, paloPw, function(err, paloKey){
        const xpath = "/config/devices/entry[@name='localhost.localdomain']/vsys/entry[@name='vsys1']/rulebase/nat/rules/entry[@name='" + entryName + "']/destination-translation/translated-address";
        const element = '<translated-address>' + ip + '</translated-address>';

        const url = 'https://' + paloIp + '/api/?type=config&action=edit&key=' + paloKey + '&xpath=' + xpath + '&element=' + element;

        const r = request.post(url, function (err, httpResponse, body) {
            if (err) {
                callback(err, err.stack);
            }
            callback(null, body);
        });
    });

};