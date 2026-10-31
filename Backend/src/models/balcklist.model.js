const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: [true, 'Token is required to be blacklisted']
        }
    },
    {
        timestamps: true
    }
);

const BlacklistToken = mongoose.model('BlacklistToken', blacklistTokenSchema);

module.exports = BlacklistToken; 