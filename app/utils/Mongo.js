class Mongo {
    constructor(mongoose) {
        this.mongoose = mongoose;
    }

    connect(url = '') {
        return new Promise((resolve, reject) => {
            global.logger.log('Connecting to MongoDB...');

            this.mongoose.connect(url, error => {
                error ? reject(error) : resolve();
            });
        })

    }

    getList(Instance) {
        return Instance.find({});
    }

    getLimitedList(Instance, limit) {
        return this.getList(Instance).limit(limit);
    }

}

module.exports = Mongo;
