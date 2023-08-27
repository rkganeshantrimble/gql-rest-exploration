import axios from 'axios';
import { config } from '../config/index.js';
const clientCreds =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdlLmlkLnRyaW1ibGVjbG91ZC5jb20iLCJleHAiOjE2OTI5NDU1MzcsIm5iZiI6MTY5Mjk0MTkzNywiaWF0IjoxNjkyOTQxOTM3LCJqdGkiOiIyYWJlMGE3ZTNlNWI0OTQwYjA3ZTc1NGQ5OWU1M2EyYyIsImp3dF92ZXIiOjIsInN1YiI6ImE4MjBkYzE2LTllYTAtNGM1Yi1iNjI0LThkNTFiNjFkZDA5NCIsImFwcGxpY2F0aW9uX25hbWUiOiJUQ01pZGRsZXdhcmUtRGV2IiwiaWRlbnRpdHlfdHlwZSI6ImFwcGxpY2F0aW9uIiwiYXV0aF90aW1lIjoxNjkyOTQxOTM3LCJhbXIiOlsiY2xpZW50X2NyZWRlbnRpYWxzIl0sImF1ZCI6WyI5YzMwYzIyYi0zMzRmLTQzY2YtYmJlNS01MmE5MTVlY2Q4MDYiXSwic2NvcGUiOiJBWERpc2NvdmVyeSJ9.B6sAIv5LbIE_zCkpRYcRysJ_Nmcv3cLHzpdAZ3X8FBo3sQEkA6CWZchMkSeA8w0iMcoYqVYolc6iJPdDe1VNC7qSUc2q7r-wYq3hjIBgiC7bRYr9XcvGr5QQhVnCtC6uH1n55zAXZ0iSWtWOZQP9mTO1PmiJ4j4ekslKvGRO10jbGzLyqmaCaK4X2jQi-WZizdJf_OIMXL9YTGg-8Nuq7uEo-zve9CTDpqpsl8WegZoKbsFGZfMtqNxB450JAL81YGuZZPMgGrI60FcFruFQB8gWcctKqJSazjUj4yPWhUS3d2W7jUSbP6UNUPNrfoMeiBLYdmEctiOz4HNUJYCvEw';
export const getUserData = async (userId: String) => {
  // Get user details
  let response = await axios.get(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.userInfo.replace(
        '<USERID>',
        userId.trim()
      ),
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );
  let result = response.data;

  // Get accounts for a user
  result.accounts = [];
  let userAccountsResponse = await axios.post(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.userAccount.replace(
        '<USERID>',
        userId.trim()
      ),
    {
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
    },
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Get account details for each account
  if (
    userAccountsResponse.data.data &&
    userAccountsResponse.data.data.length > 0
  ) {
    let accountDetailsPromises = [];

    for (const account of userAccountsResponse.data.data) {
      accountDetailsPromises.push(
        axios
          .get(
            config.service.profiles.baseUrl +
              config.service.profiles.endpoints.accountDetails.replace(
                '<ACCOUNTID>',
                account.targetProfileUuid
              ),
            {
              headers: {
                Authorization: `Bearer ${clientCreds}`,
                'Content-Type': 'application/json',
              },
            }
          )
          .then((response) => {
            return {
              ...response.data,
              role: account.attributes.role,
            };
          })
      );
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

export const getAccountData = async (
  accountId: String,
  isUserRequested: boolean
) => {
  let result = {};
  // Get account details
  let response = await axios.get(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.accountDetails.replace(
        '<ACCOUNTID>',
        accountId.trim()
      ),
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );

  result = {
    uuid: response.data.uuid,
    name: response.data.name,
    type: response.data.type,
  };
  // Get addresses linked to an account

  let addressesResponse = await axios.post(
    config.service.profiles.baseUrl +
      config.service.profiles.endpoints.addresses,
    {
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
    },
    {
      headers: {
        Authorization: `Bearer ${clientCreds}`,
        'Content-Type': 'application/json',
      },
    }
  );

  result['addresses'] = [...addressesResponse.data.data];

  if (isUserRequested) {
    // Get users of each account
    let usersResponse = await axios.post(
      config.service.profiles.baseUrl + config.service.profiles.endpoints.users,
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${clientCreds}`,
          'Content-Type': 'application/json',
        },
      }
    );
    result['users'] = usersResponse.data.data;
  }

  let filteredAddressResult = result['addresses'].map((addressObj) => {
    let filteredAddressObj = {};
    filteredAddressObj['address'] = addressObj.address;
    filteredAddressObj['city'] = addressObj.city;
    filteredAddressObj['country'] = addressObj.country;
    filteredAddressObj['postalCode'] = addressObj.postalCode;
    filteredAddressObj['state'] = addressObj.state;
    return filteredAddressObj;
  });

  let finalResult = {};
  finalResult['uuid'] = result['uuid'];
  finalResult['name'] = result['name'];
  finalResult['type'] = result['type'];
  finalResult['addresses'] = filteredAddressResult;
  if (isUserRequested) {
    let filteredUsersResult = result['users'].map((userObj) => {
      let filteredUserObj = {};
      filteredUserObj['firstName'] = userObj.firstName;
      filteredUserObj['lastName'] = userObj.lastName;
      filteredUserObj['email'] = userObj.email;
      filteredUserObj['uuid'] = userObj.uuid;
      return filteredUserObj;
    });
    finalResult['users'] = filteredUsersResult;
  }

  //   let arr=[{"name":"ganesh","age":23},{"name":"kartik","age":26}]
  // console.log(arr)
  // let newArr=arr.map((obj)=>{
  //     let newObj={}
  //     newObj.name=obj.name;
  //     return newObj
  // })
  // console.log(newArr)
  // return result;
  return finalResult;
};
