import axios from 'axios';
import { config } from '../config/index.js';
const clientCreds = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdlLmlkLnRyaW1ibGVjbG91ZC5jb20iLCJleHAiOjE2OTI4MTk2MjgsIm5iZiI6MTY5MjgxNjAyOCwiaWF0IjoxNjkyODE2MDI4LCJqdGkiOiI3NmI1MzMwYmY2NmY0ZjMwOTkwNGM0OWUzYmQxODY0OCIsImp3dF92ZXIiOjIsInN1YiI6ImE4MjBkYzE2LTllYTAtNGM1Yi1iNjI0LThkNTFiNjFkZDA5NCIsImFwcGxpY2F0aW9uX25hbWUiOiJUQ01pZGRsZXdhcmUtRGV2IiwiaWRlbnRpdHlfdHlwZSI6ImFwcGxpY2F0aW9uIiwiYXV0aF90aW1lIjoxNjkyODE2MDI4LCJhbXIiOlsiY2xpZW50X2NyZWRlbnRpYWxzIl0sImF1ZCI6WyI5YzMwYzIyYi0zMzRmLTQzY2YtYmJlNS01MmE5MTVlY2Q4MDYiXSwic2NvcGUiOiJBWERpc2NvdmVyeSJ9.pdZeDwUFygNuNHZODWYYL35BcUxn1lgYuRMnlcDZjhCXTSXCOGnbul6Im3-873R8nQNeNxwlPlm1_L0kJLsgIP0Pu9A4cQLviGvHN4i-2zsj3FrUT8-64RnuhwkWwu7bnrGoUjWbmbe8ElahufKKv_AXtDRPCNeS0HQN5olFsD6SHRhHFYDgV3ozgC0rCx_Tzh4exBYY9dPMcm1W85jHG-Ylc-Nrheluma2STuxDxiR2PfB9edWfwYuEIJ_I_3dW1DopdRg2wJb0qeGU0i0DbWk8srfFbznUIxUlCIiAc7Y-A3_br7F7PtfVwWwWngp5_xipaIHAwsROVJ185QcXLw';
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
export const getAccountData = async (accountId) => {
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
    return result;
};
