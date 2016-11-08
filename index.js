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

        options.model.find( criteria ).then(models => {

            let promise;

            if ( models.length == 0 ) {

                debug( '\x1b[0;31mModel not found creating\x1b[0;37m' );

                promise=options.model.create( res ).then(model =>{

                    resolve( model )

                } )
            } else {

                if ( models.length != 1 ) {
                    debug( 'More than one model exit for that key, now allowed!' );
                    models.forEach(m=>{JSON.stringify(models)})
                    return reject( 'More than one model exit for that key, now allowed!' )
                }

                debug( '\x1b[0;33mModel found updating\x1b[0;37m' );

                // Push values to arrays or append to value if it exists in the array
                if ( options.append_or_update ) {
                    res = appemdOrUpdate( options, res, models, reject )
                    // debug('updating',res)
                }

                promise=options.model.update( criteria, res ).then( model => {
                    debug('createdAt',model[0].createdAt)
                    debug('updatedAt', model[0].updatedAt)

                    resolve( model[0] )

                } );
            }
            // Attached catch
            promise.catch(err=>{

                return reject( err );

            });

        } )
    } )
}

function appemdOrUpdate( options, res, models, reject ) {

    options.append_or_update.forEach( ( app )=> {

        res[app.key].forEach( ( val )=> {

            let add = true;

            debug(app.unique)

            if ( app.unique ) {

                if ( typeof app.unique.key == 'object' ) {

                }

                let callback;
                let cmp;

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
                                ? new Date(e[app.unique.key]).valueOf()
                                : e[app.unique.key]
                        };
                        cmp =  callback(val);
                        break;

                    case 'object':

                        debug('it is a object');

                        // compose several keys into one unique key
                        if (app.unique.key.composed) {

                            callback=app.unique.key.composed;
                            cmp = callback(val);

                        }else {
                            debug(reject)
                            return reject('Unknown operation on unique key')
                        }
                }

                debug('callback', callback);
                debug('cmp', cmp, app.key, models);
                debug('cmp with', models[0][app.key].map( callback ))


                // do not add if it exist
                let pos = models[0][app.key].map( callback ).indexOf(cmp );

                debug('pos', pos)

                if ( pos != -1 ) {

                    // update if value exists
                    if ( app.unique.key ) {
                        debug( 'update since unique key' );
                        for ( let key in val ) {

                            debug( models[0][app.key][pos][key] );

                            models[0][app.key][pos][key] = (app.order && app.order.key == key)
                                ? app.order.fun( val[key], models[0][app.key][pos][key] )
                                : val[key]

                        }
                    }
                    // }
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

                if ( app.sort.order == 'ascending' ) {
                    debug('ascending', app.sort.order)
                    val = 1;
                }

                if ( app.sort.order == 'descending' ) {
                    debug('descending', app.sort.order)
                    val = -1;
                }

                if ( a < b )
                    return -1*val;
                if ( a > b )
                    return 1*val;
                return 0;



                // let cb = app.sort.callback ? app.sort.callback : ( val )=> {
                //     return val
                // };

                // a = app.sort.key ? cb( a[app.sort.key] ) : cb( a );
                // b = app.sort.key ? cb( b[app.sort.key] ) : cb( b );
                //
                // if ( (a - b) == NaN ) {
                //     let msg = 'Sorry a-b=NaN, callback needs to return number a=' + a + ' b=' + b;
                //     throw msg
                // }
                //
                // debug('val * (a - b)', val,val * (a - b), a, b)
                //
                // return val * (a - b);

            } );
            debug('sort res',res)
        }

    } );

    return res

}

function createOrUpdate( options, done ) {
    // var calls=[];

    debug( 'entering createOrUpdate' )

    var current = Promise.resolve();

    let p= Promise.all( options.results.map( ( res )=> {
        current = current.then( function () {

            return _createOrUpdate( options, res )
        } );

        return current;

    } ) ).then( ( results )=> {

        if ( done ) {

            debug('No promise return')
            done( null, results );
        }
        else {
            debug('Return promise');
            return results
        }

    } ).catch( ( err )=> {

        if ( done ) done( err, null );
        else throw err

    } );

    debug(p)

    return p

}

module.exports = {
    'createOrUpdate': createOrUpdate
};
