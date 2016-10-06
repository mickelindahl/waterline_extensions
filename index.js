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
                }

                options.model.update( criteria, res ).exec( function ( err, model ) {
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
                            return e[app.unique.key]
                        };
                        cmp = val[app.unique.key];
                        break;

                    case 'object':

                        debug('object')

                        if ( app.unique.key.or ) {

                            if (val[app.unique.key.or[0]]){
                                callback = ( e )=> {
                                    debug('callback 0', e[app.unique.key.or[0]])
                                    return e[app.unique.key.or[0]]
                                }
                                cmp = val[app.unique.key.or[0]];
                            } else{
                                callback = ( e )=> {
                                    debug('callback 1', e[app.unique.key.or[1]])
                                    return e[app.unique.key.or[1]]}
                                cmp = val[app.unique.key.or[1]];
                            };

                            break;

                        } else {
                            throw 'Unknown operation on unique key'
                        }
                }

                debug('callback', callback)
                debug('cmp', cmp)

                // do not add if it exist
                let pos = models[0][app.key].map( callback ).indexOf( cmp );

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

            debug( 'promise.all step' )

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