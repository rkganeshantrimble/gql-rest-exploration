import axios from 'axios';
import { config } from '../config/index.js';
const clientCreds = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdlLmlkLnRyaW1ibGVjbG91ZC5jb20iLCJleHAiOjE2OTMxMzcyMDYsIm5iZiI6MTY5MzEzMzYwNiwiaWF0IjoxNjkzMTMzNjA2LCJqdGkiOiIyYzllMjM2NzhlYzk0MDBjYjcyNmQwMzJjN2Q2NjIwYiIsImp3dF92ZXIiOjIsInN1YiI6ImE4MjBkYzE2LTllYTAtNGM1Yi1iNjI0LThkNTFiNjFkZDA5NCIsImFwcGxpY2F0aW9uX25hbWUiOiJUQ01pZGRsZXdhcmUtRGV2IiwiaWRlbnRpdHlfdHlwZSI6ImFwcGxpY2F0aW9uIiwiYXV0aF90aW1lIjoxNjkzMTMzNjA2LCJhbXIiOlsiY2xpZW50X2NyZWRlbnRpYWxzIl0sImF1ZCI6WyI5YzMwYzIyYi0zMzRmLTQzY2YtYmJlNS01MmE5MTVlY2Q4MDYiXSwic2NvcGUiOiJBWERpc2NvdmVyeSJ9.gFW7HXL-CNCg4KUuAC79Kq43ptTpSpDRa_naTlh9kDmU5aWGLYy6LusvJnBGFA60xBdas0Wn37i58-7r2R-mdg43uU1aIfLn_eIL5CChTYkVFltwY5G8LPSGREnwe1auxtrpnYJYGB5IK-thehnlENZjWiJpFhj_tJkLp2JKy2VcXtCYNaauS7kfgXDr8JZMMIaV7SyMNdtbkYg6eiOEWR0pZxiVVYfym96TPZGctQjTDFV8Yh0Xa7Nqrf7_Fz-hPgfPBPc93EfdVZ0nQqIfHcj8stfQl6u3j5b0xB5SYedvjt-ajoURaZohgZu085TLAAut_abWHhrPovbWrAQzGw';
export const getUserData = async (userId) => {
    // Get user details
    let response = await axios.get(config.service.profiles.baseUrl +
        config.service.profiles.endpoints.userInfo.replace('<USERID>', userId.trim()), {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
    let result = response.data;
    // Get accounts for a user
    result.accounts = [];
    let userAccountsResponse = await axios.post(config.service.profiles.baseUrl +
        config.service.profiles.endpoints.userAccount.replace('<USERID>', userId.trim()), {
        sortBy: 'updatedTimeStamp',
        order: 'DESC',
        relations: [
            {
                type: 'accounts',
                relationName: 'member-of',
                expr: '',
                sourceExpr: '',
            },
        ],
    }, {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
    // Get account details for each account
    if (userAccountsResponse.data.data &&
        userAccountsResponse.data.data.length > 0) {
        let accountDetailsPromises = [];
        for (const account of userAccountsResponse.data.data) {
            accountDetailsPromises.push(axios
                .get(config.service.profiles.baseUrl +
                config.service.profiles.endpoints.accountDetails.replace('<ACCOUNTID>', account.targetProfileUuid), {
                headers: {
                    Authorization: `Bearer ${clientCreds}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => {
                return {
                    ...response.data,
                    role: account.attributes.role,
                };
            }));
        }
        let allPromiseResults = await Promise.allSettled(accountDetailsPromises);
        allPromiseResults.forEach((promiseResult) => {
            if (promiseResult.status === 'fulfilled') {
                result.accounts.push({
                    accountId: promiseResult.value.uuid,
                    accountName: promiseResult.value.name,
                    role: promiseResult.value.role,
                    type: promiseResult.value.type,
                });
            }
        });
    }
    return result;
};
export const getAccountData = async (accountId, info) => {
    // console.log('info::', info.fieldNodes[0].selectionSet.selections);
    const isUserRequested = info.fieldNodes[0].selectionSet.selections.some((selection) => selection.name.value === 'users');
    console.log('isUserRequested::', isUserRequested);
    let result = {};
    // Get account details
    let response = await axios.get(config.service.profiles.baseUrl +
        config.service.profiles.endpoints.accountDetails.replace('<ACCOUNTID>', accountId.trim()), {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
    result = {
        uuid: response.data.uuid,
        name: response.data.name,
        type: response.data.type,
    };
    // Get addresses linked to an account
    let addressesResponse = await axios.post(config.service.profiles.baseUrl +
        config.service.profiles.endpoints.addresses, {
        relations: [
            {
                targetProfileFilters: {
                    type: 'accounts',
                    relationName: 'of',
                    expr: 'type=in=(shipping,billing)',
                    targetExpr: `trn==trn:profiles:accounts:${accountId}`,
                },
            },
        ],
        context: `trn:profiles:accounts:${accountId}`,
    }, {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
    result['addresses'] = [...addressesResponse.data.data];
    if (isUserRequested) {
        // Get users of each account
        let usersResponse = await axios.post(config.service.profiles.baseUrl + config.service.profiles.endpoints.users, {
            relations: [
                {
                    targetProfileFilters: {
                        type: 'accounts',
                        relationName: 'member-of',
                        expr: 'role=in=(owner,secondary_owner,admin,product_user)',
                        targetExpr: `trn==trn:profiles:accounts:${accountId}`,
                    },
                },
            ],
            context: `trn:profiles:accounts:${accountId}`,
        }, {
            headers: {
                Authorization: `Bearer ${clientCreds}`,
                'Content-Type': 'application/json',
            },
        });
        result['users'] = usersResponse.data.data;
    }
    return result;
};
export const getAccountDataByAccountId = async (accountId) => {
    // Get account details
    let response = await axios.get(config.service.profiles.baseUrl +
        config.service.profiles.endpoints.accountDetails.replace('<ACCOUNTID>', accountId.trim()), {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
    let result = {
        uuid: response.data.uuid,
        name: response.data.name,
        type: response.data.type,
    };
    return result;
};
export const getAddressessLinkedToAccount = async (accountId) => {
    // Get addresses linked to an account
    try {
        let addressesResponse = await axios.post(config.service.profiles.baseUrl +
            config.service.profiles.endpoints.addresses, {
            relations: [
                {
                    targetProfileFilters: {
                        type: 'accounts',
                        relationName: 'of',
                        expr: 'type=in=(shipping,billing)',
                        targetExpr: `trn==trn:profiles:accounts:${accountId}`,
                    },
                },
            ],
            context: `trn:profiles:accounts:${accountId}`,
        }, {
            headers: {
                Authorization: `Bearer ${clientCreds}`,
                'Content-Type': 'application/json',
            },
        });
        if (addressesResponse) {
            let result = {
                address: addressesResponse.data.data[0].address,
                city: addressesResponse.data.data[0].city,
                state: addressesResponse.data.data[0].state,
                country: addressesResponse.data.data[0].country,
                postalCode: addressesResponse.data.data[0].postalCode,
            };
            return result;
        }
    }
    catch (err) {
        throw err;
    }
};
export const getUsersLinkedToAccount = async (accountId, info) => {
    let usersResponse = await axios.post(config.service.profiles.baseUrl + config.service.profiles.endpoints.users, {
        relations: [
            {
                targetProfileFilters: {
                    type: 'accounts',
                    relationName: 'member-of',
                    expr: 'role=in=(owner,secondary_owner,admin,product_user)',
                    targetExpr: `trn==trn:profiles:accounts:${accountId}`,
                },
            },
        ],
        context: `trn:profiles:accounts:${accountId}`,
    }, {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
    console.log('usersResponse::', usersResponse.data.data);
    let result = [...usersResponse.data.data];
    return result;
    // let result = {};
    // result['users'] = usersResponse.data.data;
    // return result;
};
