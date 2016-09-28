/**
 * Created by s057wl on 2016-07-18.
 */
'use strict';
const Async=require('async');
const debug=require('debug')('waterline_extension');

function createOrUpdate(options, callback) {
    var calls=[];

    options.results.forEach( (res)=> {

        calls.push(function(_callback){

            var criteria={};
            options.keys.forEach((key)=>{
                criteria[key]=res[key]
            });

            debug('Criteria', criteria);

            options.model.find(criteria).exec(function (err, models) {

                if (err) {
                    return _callback(err);
                }
                if (models.length == 0) {

                    debug('\x1b[0;31mModel not found\x1b[0;37m');

                    options.model.create(res).exec(function (err, model) {
                        if (err) {
                            return _callback(err);
                        }
                        _callback(null, model)
                    });
                } else {

                    if (models.length!=1){
                        debug('More than one model exit for that key, now allowed!');
                        return _callback('More than one model exit for that key, now allowed!', null)
                    }

                    debug('\x1b[0;33mModel found\x1b[0;37m');

                    // Push values to arrays or append to value if it exists in the array
                    if (options.append_or_update){
                        options.append_or_update.forEach((app)=> {

                            res[app.key].forEach((val)=>{

                                let add=true;

                                if (app.unique){

                                    // do not add if it exist
                                    let cb = app.unique.key ? (e)=>{ return e[app.unique.key]} : (e)=>{ return e};
                                    let cmp = app.unique.key ? val[app.unique.key]: val;

                                    let pos = models[0][app.key].map( cb ).indexOf(cmp);

                                    if(pos != -1){
                                        if (app.order){

                                            debug('app.update');

                                            // update if value exists
                                            if(app.unique.key){
                                                for (let key in val){

                                                    debug(models[0][app.key][pos][key]);

                                                    models[0][app.key][pos][key]=(app.order && app.order.key==key)
                                                        ? app.order.fun(val[key], models[0][app.key][pos][key])
                                                        : val[key]

                                                }
                                            }
                                        }
                                        add=false;
                                    }
                                }

                                if (add){
                                    models[0][app.key].push(val)
                                }

                            });
                            res[app.key]= models[0][app.key];

                            if (app.sort){

                                // sort on each post by time
                                res[app.key].sort((a, b)=>{
                                    let val;
                                    if (app.sort.order='ascending'){val=1;}
                                    if (app.sort.order='descending'){val=-1;}

                                    let cb=app.sort.callback ?  app.sort.callback :(val)=>{return val};

                                    a=app.sort.key ? cb(a[app.sort.key]) : cb(a);
                                    b=app.sort.key ? cb(b[app.sort.key]) : cb(b);

                                    if ((a-b)==NaN){
                                        let msg='Sorry a-b=NaN, callback needs to return number a='+a+' b='+b;
                                        throw msg
                                    }
                                    return val*(a- b);

                                });
                            }

                        });
                    }

                    options.model.update(criteria, res).exec(function (err, model) {
                        if (err) {
                            console.error(err);
                            return _callback(err);
                        }
                        _callback(null, model[0])
                    });
                }
            })
        })
    });

    Async.series(calls,function(err, models){
        // console.log(models)
        callback(err, models)
    })
}

module.exports={
    'createOrUpdate':createOrUpdate
}