export const config = {
    service: {
        profiles: {
            baseUrl: 'https://cloud.stage.api.trimblecloud.com/tcloud-profiles-stage/1.0/profiles',
            endpoints: {
                userInfo: '/users/<USERID>',
                userAccount: '/users/<USERID>/relations/_filter',
                accountDetails: '/accounts/<ACCOUNTID>',
                addresses: '/addresses/_filter',
                users: '/users/_filter',
            },
        },
        accountMaster: {
            baseUrl: 'https://cloud.stage.api.trimblecloud.com/cloud/accounts/1.0',
            endpoints: {
                accounts: '/accounts?fields=full',
                accountDetails: '/accounts/<ACCOUNTID>',
            },
        },
    },
};
