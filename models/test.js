/**
 * Created by s057wl on 2016-07-18.
 */

const we=require('../index');

module.exports = {

    identity: 'test',

    attributes: {
        test: 'string',
        dummy: 'string'
    },

    createOrUpdate:function(options, callback){
        // console.dir()
        options.model=this;//options.server.getModel('test');
        we.createOrUpdate(options, callback)
    }
};