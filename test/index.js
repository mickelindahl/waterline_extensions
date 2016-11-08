/**
 * Created by s057wl on 2016-07-18.
 */

/**
 * Created by s057wl on 2016-07-14.
 */
'use strict'

const Code = require('code');   // assertion library
const Lab=require('lab');
const server = require('../test_server');
const debug = require('debug')('test')

let lab = exports.lab = Lab.script();
let _key_date=new Date();

lab.experiment('waterline', function () {

    lab.before({},function (done) {

        // console.log('before')
        let iv = setInterval( function () {
            if (server.app.readyForTest == true) {
                clearInterval(iv);
                let Model=server.getModel('test');
                // console.log(Model)
                let data=[];
                for (let i=0; i<10;i++){
                    data.push({
                        test:new Date(_key_date.valueOf()+i*3600),
                    })
                }
                Model.create(data).exec( function(err, models){
                    done();
                });
            }
        }, 50);
    });

    lab.test('createOrUpdate', function (done) {
        let data=[];

        for (let i=0; i<20;i++){
            data.push({test: new Date(_key_date.valueOf()+i*3600),
                dummy:'hej'})
        }
        let Model=server.getModel('test');
        let options={
            nojson:true,
            keys:['test'],
            results: data
        };

        debug(options)

        Model.createOrUpdate(options, function(err, models){

            if(err){
                debug(err)
            }

            for (let i=0;i<10;i++){
                Code.expect(models[i].createdAt.toJSON()==models[i].updatedAt.toJSON()).to.be.false();
                Code.expect('hej'==models[i].dummy).to.be.true();

            }
            for (let i=10;i<20;i++){
                Code.expect(models[i].createdAt.toJSON()==models[i].updatedAt.toJSON()).to.be.true();
                Code.expect('hej'==models[i].dummy).to.be.true();
            }
            done()
        })
    });

    lab.test('createOrUpdate append, sort and unique', function (done) {

        let data1=[];
        let data2=[];
        let data3=[];
        let data4=[];


        for (let i=0; i<2;i++){
            data1.push({
                test: new Date(_key_date.valueOf()+i*3600),
                dummy2: ['5'],
                dummy3: [{id:i-2, date: new Date()}],
            });
            data2.push({
                test:new Date(_key_date.valueOf()+i*3600),
                dummy2:['10'],
                dummy3:[{id:i+1, date:new Date(new Date().valueOf()+2000)}],
            });
            data3.push({
                test:new Date(_key_date.valueOf()+i*3600),
                dummy2:['10'],
                dummy3:data2[data2.length-1].dummy3,
            })

            data4.push({
                test:new Date(_key_date.valueOf()+i*3600),
                dummy2:['10'],
                dummy3:[{id:i+1, date:new Date(new Date().valueOf()+3600*4*1000)},{id:i-2, date:new Date(new Date().valueOf()+3600*4*1000)}],
            })
        }

        let Model=server.getModel('test');

        let options={
            keys:['test'],
            results: data1
        };
        Model.createOrUpdate(options, function(err, models){

            let options={
                keys:['test'],
                results: data2,
                append_or_update:[
                    {
                        key:'dummy2',
                        unique:true,
                        sort:{
                            order:'ascending',
                            'callback':(val)=>{return Number(val)}
                        }
                    },
                    {
                        key:'dummy3',
                        unique:{key:'id'},
                        sort:{
                            order:'descending',
                            key:'id',
                            'callback':(val)=>{return new Date(val).valueOf()}
                        },

                        order: { //update order
                            key: 'date',
                            fun: (a, b)=> {
                                return new Date(Math.max(new Date(a).valueOf(), new Date(b).valueOf()))
                            }
                        }

                    }
                ]
            };

            Model.createOrUpdate(options, function(err, models) {


                // debug('models', models)

                models.forEach((model)=>{

                    // debug('hej!!!',model)

                    Code.expect(model.createdAt.toJSON()==model.updatedAt.toJSON()).to.be.false();
                    Code.expect(Number(model.dummy2[0])>Number(model.dummy2[1])).to.be.true();
                    Code.expect(model.dummy3[0].id<model.dummy3[1].id).to.be.true();
                });

                options.results=data3;
                Model.createOrUpdate(options, function(err, models) {
                    models.forEach((model)=>{
                        Code.expect(model.dummy2.length).to.equal(2);
                        Code.expect(model.dummy3.length).to.equal(2);
                    });

                    options.results=data4;
                    Model.createOrUpdate(options, function(err, models) {

                        data3.forEach((d)=>{debug(d)})
                        data4.forEach((d)=>{debug(d)})

                        let j=0;
                        models.forEach((model)=>{

                            Code.expect(model.dummy2.length).to.equal(2);
                            Code.expect(model.dummy3.length).to.equal(2);

                            for (let i=0; i<model.dummy3.length;i++){

                                Code.expect(model.dummy3[i].date).to.equal(data4[j].dummy3[i].date);
                            }
                            j++
                        });
                        done()
                    });

                });

            })
        })
    });

    lab.test('createOrUpdate sort without callback', function (done) {

        let data1=[];

        for (let i=0; i<2;i++){
            data1.push({
                test: new Date(_key_date.valueOf()+i*3600),
                dummy2: ['5'],
                dummy3: [{id:i-1, date: new Date()}, {id:i-2, date: new Date()}],
            });
        }

        let Model=server.getModel('test2');

        let options={
            keys:['test'],
            results: data1,
            append_or_update:[
                {
                    key:'dummy3',
                    unique:true,
                    sort:{
                        key:'id',
                        order:'ascending',
                    }
                },
                ]
        };

        Model.create(data1).then(m=>{

            Model.createOrUpdate(options, function(err, models){

                done()

            })
        })

    });

    lab.test('createOrUpdate not unique', function (done) {

        let data1=[];


        for (let i=0; i<2;i++){
            data1.push({
                test: new Date(_key_date.valueOf()+i*3600),
                dummy2: ['5'],
                dummy3: [{id:i-2, date: new Date()}],
            });
        }

        let Model=server.getModel('test');

        let options= {
            keys: ['test'],
            results: data1,
            append_or_update: [
                {
                    key: 'dummy2',
                    unique: false

                }]

            };
        Model.createOrUpdate(options).then( models=> {

            done()

        })
    });


    lab.test('createOrUpdate unique type string with datetime', function (done) {

        let data1 = [];


        for ( let i = 0; i < 2; i++ ) {
            data1.push( {
                test: new Date( new Date().valueOf() + i * 3600 ),
                dummy2: '5',
                dummy3: [{date:new Date()}],
            } );
        }

        let Model = server.getModel( 'test' );

        let options = {
            keys: ['test'],
            results: data1,
            append_or_update: [
                {
                    key: 'dummy3',
                    unique: {
                        type: 'datetime',
                        key:'date'

                    },
                }]

        };

        Model.create(data1).then(models=>{

            Model.createOrUpdate( options, function ( err, models ) {

                // debug('models key', models)

                // let criteria=models.map(e=>{return {id:e.id}})

                // Model.destroy(criteria).then(models=>{
                    // debug('destroyed models', models );
                    done();
                // })

            } );
        })


    });

    lab.test('createOrUpdate append with function key', function (done) {

        let data1=[];
        let data2=[];


        for (let i=0; i<2;i++){

            let date= 'date1' ;

            data1.push({
                test: new Date(_key_date.valueOf()+i*3600),
                dummy3: [{id:i, [date]: new Date()}],
            });
            data2.push({
                test:new Date(_key_date.valueOf()+i*3600),
                dummy3:[{id:i, [date]:new Date(new Date().valueOf()+2000)}],
            });
            data2.push(data1[data1.length-1])

        }

        let Model=server.getModel('test');

        let options={
            keys:['test'],
            results: data1
        };
        Model.createOrUpdate(options, function(err, models){

            let options={
                keys:['test'],
                results: data2,
                append_or_update:[
                    {
                        key:'dummy3',
                        unique:{
                            key:(e)=>{ return e['id']+e['date1'].valueOf()},
                            type:'datetime'},
                    }
                ]
            };

            Model.createOrUpdate(options, function(err, models) {

                if(err) console.error(err)

                Code.expect(models[0].dummy3.length).to.equal(2);

                done()

            })
        })
    });

    lab.test('createOrUpdate multiple models for same search criteria in db error', function (done) {

        let Model=server.getModel('test');

        Model.create([
            {id:1},
            {id:1},

        ]).then(models=>{
            let options={
                keys:['id'],
                results: [
                    {id:1}],
            };
            Model.createOrUpdate(options).then( models=>{

                done()

            }).catch(err=>{

                Code.expect(err).to.equal('More than one model exit for that key, now allowed!')

                done()

            })
        })
    });

    lab.test('createOrUpdate thrwo error', function (done) {

        let Model=server.getModel('test');


            let options={
                keys:['id'],
                results: [  {'dummy':{}}],
            };
            Model.createOrUpdate(options, (err, models)=>{

                if(err){
                    done()
                }



            })

    });

    lab.test('createOrUpdate thrwo error promise', function (done) {

        let Model=server.getModel('test');


        let options={
            keys:['id'],
            results: [  {'dummy':{}}],
        };
        Model.createOrUpdate(options).then( models=>{

        }).catch(err=>{

            done()

        })

    });

});