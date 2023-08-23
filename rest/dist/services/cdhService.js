import axios from 'axios';
import { config } from '../config/index.js';
const clientCreds = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdlLmlkLnRyaW1ibGVjbG91ZC5jb20iLCJleHAiOjE2OTE0ODgzNzMsIm5iZiI6MTY5MTQ4NDc3MywiaWF0IjoxNjkxNDg0NzczLCJqdGkiOiJlMjk1NjE3MTExMDE0YTgxYTA5MTM2NGQ2MWJjZDA1OSIsImp3dF92ZXIiOjIsInN1YiI6ImE4MjBkYzE2LTllYTAtNGM1Yi1iNjI0LThkNTFiNjFkZDA5NCIsImFwcGxpY2F0aW9uX25hbWUiOiJUQ01pZGRsZXdhcmUtRGV2IiwiaWRlbnRpdHlfdHlwZSI6ImFwcGxpY2F0aW9uIiwiYXV0aF90aW1lIjoxNjkxNDg0NzczLCJhbXIiOlsiY2xpZW50X2NyZWRlbnRpYWxzIl0sImF1ZCI6WyI5YzMwYzIyYi0zMzRmLTQzY2YtYmJlNS01MmE5MTVlY2Q4MDYiXSwic2NvcGUiOiJBWERpc2NvdmVyeSJ9.fDdS90Jcs-W3jioRIs1xdIZgWRlmDYRaN-zIWRT6Ps5d_xRW0LgToyewGEkorgzx3cxX6pml1Ue62ILp09rRKfE9EHDXO0MUxoXM4URSj_raTGtThRYHIWqQsa8t47MwI6aPEDnCDPdMY2lr0cp30cA43Hk0goa2QiCEWd4tkOX1-9reN6SnHWTKOehwSFUCbS4QQP-NsTVNob_gPeX4367wFbe72RfmYrPgUISQ7NFDws3QiwnQExpZQhVJwl6oOFYTe8_bUvB7n-kTut9QqnCjiOSKViGZZN-00m8RUH1uNXWJWPhO9ADjIvXM-nxa37sPzC5NrGm8rOdYupbM5A';
const getAccounts = async () => {
    let response = await axios.post(config.service.accountMaster.baseUrl +
        config.service.accountMaster.endpoints.accounts, {
        headers: {
            Authorization: `Bearer ${clientCreds}`,
            'Content-Type': 'application/json',
        },
    });
};
