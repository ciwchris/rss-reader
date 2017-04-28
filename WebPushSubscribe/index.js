var azure = require('azure-storage');

module.exports = function (context, req) {
    context.log('Subscription function triggered');
    const table = 'subscriptions';

    var tableSvc = azure.createTableService();
    tableSvc.createTableIfNotExists(table, function(error, result, response){
        if(error){
            context.log('Error creating table: ' + JSON.stringify(error));
        } else {
            var entGen = azure.TableUtilities.entityGenerator;
            var task = {
                PartitionKey: entGen.String('rssreader'),
                RowKey: entGen.String(req.body.subscription.keys.auth),
                title: entGen.String(JSON.stringify(req.body.subscription))
            };

            tableSvc.insertEntity(table, task, function (error, result, response) {
                if(error && error.statusCode !== 409){
                    context.log('Error inserting subscription: ' + JSON.stringify(error));
                }
                
                context.done();
            });
        }
    });

};
