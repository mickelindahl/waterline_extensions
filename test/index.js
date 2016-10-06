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

            debug(JSON.stringify(models, null,4))

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
                            order:'ascending',
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

                models.forEach((model)=>{

                    debug(model)

                    Code.expect(Number(model.dummy2[0])>Number(model.dummy2[1])).to.be.true();
                    Code.expect(model.dummy3[0].id>model.dummy3[1].id).to.be.true();
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


    lab.test('createOrUpdate append with or on key', function (done) {

        let data1=[];
        let data2=[];
        let data3=[];
        let data4=[];


        for (let i=0; i<2;i++){

            let id=i==0 ? 'id1' : 'id2';

            data1.push({
                test: new Date(_key_date.valueOf()+i*3600),
                dummy3: [{[id]:i, date: new Date()}],
            });
            data2.push({
                test:new Date(_key_date.valueOf()+i*3600),
                dummy3:[{[id]:i, date:new Date(new Date().valueOf()+2000)}],
            });

            // data3.push({
            //     test:new Date(_key_date.valueOf()+i*3600),
            //     dummy3:[{[id]:i+1, date:new Date(new Date().valueOf()+3600*4*1000)},{id:i-2, date:new Date(new Date().valueOf()+3600*4*1000)}],
            // })
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
                        unique:{key:{or:['id1', 'id2']}},
                    }
                ]
            };

            Model.createOrUpdate(options, function(err, models) {

                if(err) console.error(err)

                debug(models, models[0].dummy3[0].date, data2[0].dummy3[0].date)
                Code.expect(models[0].dummy3[0].id1==data2[0].dummy3[0].id1).to.be.true();
                Code.expect(models[0].dummy3[0].date.valueOf()==data2[0].dummy3[0].date.valueOf()).to.be.true();
                Code.expect(models[1].dummy3[0].id2==data2[1].dummy3[0].id2).to.be.true();

                done()

            })
        })
    });

});