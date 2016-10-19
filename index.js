/**
 * Created by s057wl on 2016-07-18.
 */
'use strict';
const Promise = require( 'bluebird' )
const debug = require( 'debug' )( 'waterline_extension' );


function _createOrUpdate( options, res ) {

    return new Promise( ( resolve, reject )=> {

        let criteria = {};
        options.keys.forEach( ( key )=> {
            criteria[key] = res[key]
        } );

        debug( 'Criteria', criteria );

        options.model.find( criteria ).exec( function ( err, models ) {

            if ( err ) {
                return _callback( err );
            }
            if ( models.length == 0 ) {

                debug( '\x1b[0;31mModel not found creating\x1b[0;37m' );

                options.model.create( res ).exec( function ( err, model ) {
                    if ( err ) {
                        return reject( err )
                    }
                    resolve( model )
                } );
            } else {

                if ( models.length != 1 ) {
                    debug( 'More than one model exit for that key, now allowed!' );
                    return reject( 'More than one model exit for that key, now allowed!' )
                }

                debug( '\x1b[0;33mModel found updating\x1b[0;37m' );

                // Push values to arrays or append to value if it exists in the array
                if ( options.append_or_update ) {
                    res = appemdOrUpdate( options, res, models )
                    // debug('updating',res)
                }

                options.model.update( criteria, res ).exec( function ( err, model ) {
                    debug('createdAt',model[0].createdAt)
                    debug('updatedAt', model[0].updatedAt)

                    if ( err ) {
                        console.error( err );
                        return reject( err );
                    }
                    resolve( model[0] )
                } );
            }
        } )
    } )
}

function appemdOrUpdate( options, res, models ) {

    options.append_or_update.forEach( ( app )=> {

        res[app.key].forEach( ( val )=> {

            let add = true;

            if ( app.unique ) {

                if ( typeof app.unique.key == 'object' ) {

                }

                let callback;
                let cmp;

                debug(typeof app.unique.key)

                switch ( typeof app.unique.key ) {

                    case "undefined":

                      callback = ( e )=> {
                            return e
                        };
                        cmp = val;
                        break;

                    case 'string':

                        callback = ( e )=> {
                            return app.unique.type=='datetime'
                                ? new Date(e[app.unique.key])
                                : e[app.unique.key].valueOf()
                        };
                        cmp = app.unique.type=='datetime'
                            ? new Date(val[app.unique.key])
                            : val[app.unique.key].valueOf();
                        break;

                    case 'object':

                        debug('object');

                        if ( app.unique.key.or ) {

                            let i = val[app.unique.key.or[0]] ? 0 : 1;
                            callback = ( e )=> {
                                debug('callback '+i, app.unique.type=='datetime'
                                    ? (new Date(e[app.unique.key.or[i]])).valueOf()
                                    : e[app.unique.key.or[0]]);
                                return app.unique.type=='datetime'
                                    ? (new Date(e[app.unique.key.or[i]])).valueOf()
                                    : e[app.unique.key.or[0]]
                            };
                            cmp = val[app.unique.key.or[i]];
                            break;

                        } else {
                            throw 'Unknown operation on unique key'
                        }
                }

                cmp=app.unique.type=='datetime'
                    ? new Date(cmp)
                    : cmp

                debug('callback', callback);
                debug('cmp', cmp);
                debug('cmp with', models[0][app.key].map( callback ))


                // do not add if it exist
                let pos = models[0][app.key].map( callback ).indexOf(cmp );

                debug('pos', pos)

                if ( pos != -1 ) {
                    if ( app.order ) {

                        debug( 'app.update' );

                        // update if value exists
                        if ( app.unique.key ) {

                            for ( let key in val ) {

                                debug( models[0][app.key][pos][key] );

                                models[0][app.key][pos][key] = (app.order && app.order.key == key)
                                    ? app.order.fun( val[key], models[0][app.key][pos][key] )
                                    : val[key]

                            }
                        }
                    }
                    add = false;
                }
            }

            if ( add ) {
                models[0][app.key].push( val )
            }

        } );
        res[app.key] = models[0][app.key];

        if ( app.sort ) {

            debug('sorting order', app.sort.order, 'callback', app.sort.callback )

            // sort on each post by time
            res[app.key].sort( ( a, b )=> {
                let val;
                if ( app.sort.order = 'ascending' ) {
                    val = 1;
                }
                if ( app.sort.order = 'descending' ) {
                    val = -1;
                }

                let cb = app.sort.callback ? app.sort.callback : ( val )=> {
                    return val
                };

                a = app.sort.key ? cb( a[app.sort.key] ) : cb( a );
                b = app.sort.key ? cb( b[app.sort.key] ) : cb( b );

                if ( (a - b) == NaN ) {
                    let msg = 'Sorry a-b=NaN, callback needs to return number a=' + a + ' b=' + b;
                    throw msg
                }
                return val * (a - b);

            } );
        }

    } );

    return res

}

function createOrUpdate( options, done ) {
    // var calls=[];

    debug( 'entering createOrUpdate' )

    var current = Promise.resolve();

    return Promise.all( options.results.map( ( res )=> {
        current = current.then( function () {

            return _createOrUpdate( options, res )
        } );

        return current;

    } ) ).then( ( results )=> {

        if ( done ) done( null, results );
        else return results

    } ).catch( ( err )=> {

        if ( done ) done( err, null );
        else throw err

    } );

}

module.exports = {
    'createOrUpdate': createOrUpdate
}
let l = [{
    "country": "SE",
    "station": "HP",
    "predicted_time": "2016-10-10T14:30:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "station": "TL",
    "delay": -4,
    "country": "SE",
    "time": "2016-10-11T07:38:00.000Z",
    "predicted_time": "2016-10-11T07:42:00.000Z",
    "type": "departure",
    "operational": 5013
}, {
    "country": "SE",
    "station": "VSK",
    "predicted_time": "2016-10-10T14:47:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "SET",
    "predicted_time": "2016-10-10T14:58:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "BEN",
    "predicted_time": "2016-10-10T15:05:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": false
}, {
    "country": "SE",
    "station": "BEN",
    "predicted_time": "2016-10-10T15:35:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "KLX",
    "predicted_time": "2016-10-10T15:39:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "RAN",
    "predicted_time": "2016-10-10T15:46:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "KOJ",
    "predicted_time": "2016-10-10T15:51:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "BET",
    "predicted_time": "2016-10-10T15:59:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "MJV",
    "predicted_time": "2016-10-10T16:05:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "SBÄ",
    "predicted_time": "2016-10-10T16:09:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "GEN",
    "predicted_time": "2016-10-10T16:21:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "BRÅ",
    "predicted_time": "2016-10-10T16:30:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "NML",
    "predicted_time": "2016-10-10T16:35:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "HUÖ",
    "predicted_time": "2016-10-10T16:44:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "BUD",
    "predicted_time": "2016-10-10T16:55:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "BDN",
    "predicted_time": "2016-10-10T16:59:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": false
}, {
    "country": "SE",
    "station": "BDN",
    "predicted_time": "2016-10-10T17:49:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BDS",
    "predicted_time": "2016-10-10T17:55:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "BDS",
    "predicted_time": "2016-10-10T17:58:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HT",
    "predicted_time": "2016-10-10T18:04:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DBN",
    "predicted_time": "2016-10-10T18:10:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "DBN",
    "predicted_time": "2016-10-10T18:13:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BRG",
    "predicted_time": "2016-10-10T18:25:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LRG",
    "predicted_time": "2016-10-10T18:31:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÄY",
    "predicted_time": "2016-10-10T18:37:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "NYF",
    "predicted_time": "2016-10-10T18:38:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KTÄ",
    "predicted_time": "2016-10-10T18:42:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "JNT",
    "predicted_time": "2016-10-10T18:50:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "STS",
    "predicted_time": "2016-10-10T18:59:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KLR",
    "predicted_time": "2016-10-10T19:11:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SBI",
    "predicted_time": "2016-10-10T19:18:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LTK",
    "predicted_time": "2016-10-10T19:30:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MHN",
    "predicted_time": "2016-10-10T19:41:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "THM",
    "predicted_time": "2016-10-10T19:53:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "STO",
    "predicted_time": "2016-10-10T20:01:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "JRN",
    "predicted_time": "2016-10-10T20:12:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "JRN",
    "predicted_time": "2016-10-10T20:39:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LDL",
    "predicted_time": "2016-10-10T20:48:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KRB",
    "predicted_time": "2016-10-10T20:56:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BST",
    "predicted_time": "2016-10-10T21:07:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KAÄ",
    "predicted_time": "2016-10-10T21:15:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÅST",
    "predicted_time": "2016-10-10T21:21:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LUÄ",
    "predicted_time": "2016-10-10T21:26:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ETK",
    "predicted_time": "2016-10-10T21:33:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "YÖ",
    "predicted_time": "2016-10-10T21:42:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HLS",
    "predicted_time": "2016-10-10T21:52:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "VDN",
    "predicted_time": "2016-10-10T22:03:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "TVÄ",
    "predicted_time": "2016-10-10T22:13:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "TVB",
    "predicted_time": "2016-10-10T22:25:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "VÄN",
    "predicted_time": "2016-10-10T22:30:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "VNS",
    "predicted_time": "2016-10-10T22:32:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "VNS",
    "predicted_time": "2016-10-10T22:47:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DGM",
    "predicted_time": "2016-10-10T22:57:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HSÖ",
    "predicted_time": "2016-10-10T23:07:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HBÄ",
    "predicted_time": "2016-10-10T23:12:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÖÄ",
    "predicted_time": "2016-10-10T23:16:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "OXM",
    "predicted_time": "2016-10-10T23:23:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BRS",
    "predicted_time": "2016-10-10T23:25:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "NRS",
    "predicted_time": "2016-10-10T23:32:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "THÖ",
    "predicted_time": "2016-10-10T23:42:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LNV",
    "predicted_time": "2016-10-10T23:49:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LMN",
    "predicted_time": "2016-10-10T23:52:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BJ",
    "predicted_time": "2016-10-11T00:01:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BJÖ",
    "predicted_time": "2016-10-11T00:10:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "GE",
    "predicted_time": "2016-10-11T00:18:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MSL",
    "predicted_time": "2016-10-11T00:21:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ANÖ",
    "predicted_time": "2016-10-11T00:30:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KÄV",
    "predicted_time": "2016-10-11T00:39:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SOP",
    "predicted_time": "2016-10-11T00:47:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HOÅ",
    "predicted_time": "2016-10-11T00:56:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "AP",
    "predicted_time": "2016-10-11T01:02:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SOM",
    "predicted_time": "2016-10-11T01:06:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "GNÅ",
    "predicted_time": "2016-10-11T01:11:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BAÖ",
    "predicted_time": "2016-10-11T01:15:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SLJ",
    "predicted_time": "2016-10-11T01:20:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "FSM",
    "predicted_time": "2016-10-11T01:25:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÖSÅ",
    "predicted_time": "2016-10-11T01:31:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LSL",
    "predicted_time": "2016-10-11T01:38:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "LSL",
    "predicted_time": "2016-10-11T01:41:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HLM",
    "predicted_time": "2016-10-11T01:50:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "GA",
    "predicted_time": "2016-10-11T01:58:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "FGÖ",
    "predicted_time": "2016-10-11T02:03:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BSG",
    "predicted_time": "2016-10-11T02:10:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "RU",
    "predicted_time": "2016-10-11T02:19:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SNGÅ",
    "predicted_time": "2016-10-11T02:24:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HÅ",
    "predicted_time": "2016-10-11T02:28:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KEI",
    "predicted_time": "2016-10-10T14:41:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": false
}, {
    "country": "SE",
    "station": "KLN",
    "predicted_time": "2016-10-11T02:36:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÖVÖ",
    "predicted_time": "2016-10-11T02:42:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "GSN",
    "predicted_time": "2016-10-11T02:46:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DK",
    "predicted_time": "2016-10-11T02:51:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KSG",
    "predicted_time": "2016-10-11T02:56:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "KSG",
    "predicted_time": "2016-10-11T02:58:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "NY",
    "predicted_time": "2016-10-11T03:05:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "NY",
    "predicted_time": "2016-10-11T03:22:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "GRÖ",
    "predicted_time": "2016-10-11T03:31:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "GRÖ",
    "predicted_time": "2016-10-11T03:43:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BÖN",
    "predicted_time": "2016-10-11T03:49:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BÄ",
    "predicted_time": "2016-10-11T03:55:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BSB",
    "predicted_time": "2016-10-11T03:58:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DY",
    "predicted_time": "2016-10-11T04:04:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MDL",
    "predicted_time": "2016-10-11T04:08:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÅGY",
    "predicted_time": "2016-10-11T04:14:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÅGGB",
    "predicted_time": "2016-10-11T04:16:00.000Z",
    "operational": 5011,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "ÅGGB",
    "predicted_time": "2016-10-11T06:16:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÅG",
    "predicted_time": "2016-10-11T06:19:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "OSÖ",
    "predicted_time": "2016-10-11T06:25:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "AY",
    "predicted_time": "2016-10-11T06:31:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÖV",
    "predicted_time": "2016-10-11T06:39:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "JÅ",
    "predicted_time": "2016-10-11T06:45:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MSÖ",
    "predicted_time": "2016-10-11T06:52:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "NG",
    "predicted_time": "2016-10-11T06:58:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "RSÖ",
    "predicted_time": "2016-10-11T07:04:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÖBN",
    "predicted_time": "2016-10-11T07:09:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HNB",
    "predicted_time": "2016-10-11T07:14:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HNN",
    "predicted_time": "2016-10-11T07:18:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LTR",
    "predicted_time": "2016-10-11T07:26:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "TL",
    "predicted_time": "2016-10-11T07:34:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "TL",
    "predicted_time": "2016-10-11T07:42:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LS",
    "predicted_time": "2016-10-11T07:50:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SKÄ",
    "predicted_time": "2016-10-11T07:58:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "JR",
    "predicted_time": "2016-10-11T08:03:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "JR",
    "predicted_time": "2016-10-11T08:10:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LÖ",
    "predicted_time": "2016-10-11T08:16:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KSÖ",
    "predicted_time": "2016-10-11T08:22:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "KSÖ",
    "predicted_time": "2016-10-11T08:30:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SMÅ",
    "predicted_time": "2016-10-11T08:39:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "VL",
    "predicted_time": "2016-10-11T08:44:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "AB",
    "predicted_time": "2016-10-11T08:48:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LOT",
    "predicted_time": "2016-10-11T08:52:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BN",
    "predicted_time": "2016-10-11T08:59:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KLS",
    "predicted_time": "2016-10-11T09:12:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "RBO",
    "predicted_time": "2016-10-11T09:20:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HDN",
    "predicted_time": "2016-10-11T09:25:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "LB",
    "predicted_time": "2016-10-11T09:32:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DÖL",
    "predicted_time": "2016-10-11T09:36:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MOG",
    "predicted_time": "2016-10-11T09:40:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "OB",
    "predicted_time": "2016-10-11T09:44:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MSN",
    "predicted_time": "2016-10-11T09:56:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "MSN",
    "predicted_time": "2016-10-11T10:02:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "JB",
    "predicted_time": "2016-10-11T10:11:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÅH",
    "predicted_time": "2016-10-11T10:17:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SV",
    "predicted_time": "2016-10-11T10:24:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "SV",
    "predicted_time": "2016-10-11T10:35:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "TSÅ",
    "predicted_time": "2016-10-11T10:45:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HÄ",
    "predicted_time": "2016-10-11T10:50:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DGN",
    "predicted_time": "2016-10-11T10:55:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "BY",
    "predicted_time": "2016-10-11T10:59:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HL",
    "predicted_time": "2016-10-11T11:02:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HLR",
    "predicted_time": "2016-10-11T11:03:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MRS",
    "predicted_time": "2016-10-11T11:06:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "FS",
    "predicted_time": "2016-10-11T11:13:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "JU",
    "predicted_time": "2016-10-11T11:17:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "AVKY",
    "predicted_time": "2016-10-11T11:21:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HMA",
    "predicted_time": "2016-10-11T11:34:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KBN",
    "predicted_time": "2016-10-11T11:38:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SNT",
    "predicted_time": "2016-10-11T11:42:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "FGC",
    "predicted_time": "2016-10-11T11:53:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "FGC",
    "predicted_time": "2016-10-11T12:11:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "DN",
    "predicted_time": "2016-10-11T12:25:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SKB",
    "predicted_time": "2016-10-11T12:32:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KRN",
    "predicted_time": "2016-10-11T12:41:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "NKT",
    "predicted_time": "2016-10-11T12:48:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SBA",
    "predicted_time": "2016-10-11T12:56:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "SLG",
    "predicted_time": "2016-10-11T13:00:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "FV",
    "predicted_time": "2016-10-11T13:08:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ER",
    "predicted_time": "2016-10-11T13:15:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HSA",
    "predicted_time": "2016-10-11T13:22:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "ÖR",
    "predicted_time": "2016-10-11T13:29:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "MS",
    "predicted_time": "2016-10-11T13:37:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "KLA",
    "predicted_time": "2016-10-11T13:42:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HPBG",
    "predicted_time": "2016-10-11T13:49:00.000Z",
    "operational": 5013,
    "type": "departure",
    "available": true
}, {
    "country": "SE",
    "station": "HRBG",
    "predicted_time": "2016-10-11T13:55:00.000Z",
    "operational": 5013,
    "type": "arrival",
    "available": true
}, {
    "country": "SE",
    "station": "ROB",
    "predicted_time": "2016-10-11T02:32:00.000Z",
    "operational": 5011,
    "type": "departure",
    "available": true
}]