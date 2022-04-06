import { web3 } from "@project-serum/anchor";
import * as metadata from "../utils/metadata"; // see metadata.ts

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// const anchor = require("@project-serum/anchor");
const axios = require("axios").default;
const fs = require("fs");

// const redis = require("redis");
// const redisClient = redis.createClient();

const input: string[] = [
  "CxDNFoWumuzoQ61yQpwmtPfQCjvWosathAL5bbYX3Edj",
  "CpMX6EVyFghPTuMtpDvwSCCxYcSSX5qJdqa1yMiUHokZ",
  "DagAYBUtqzyCuddPbczbwBHPUNdtcyC4BWsADLxaHUxd",
  "BKQS2AaB67EqFqj536H7oCAh6gb9ecU52pfCuGD4Uby1",
  "ddg63nDAWUJqy2qreU98ehkFaUCfmJPPDe7ph9EBPex",
  "722kj9RmXp42obHsNd8Y2uzRGgkB5V5yiKPqMdSw3Wa6",
  "5bdefxVBpriHt7y9mYpcZRZxRUEP68uPC72rtpA34Tx2",
  "EnntQqEwyafgho3TrSeBE9nswydc8NHh6Gh59KHduuYX",
  "7VH3w1m7ZRGpxRgnFNJLktiMNiBYgBAu6FztjD3d31E9",
  "3AzJrwD5o2YkvBzc4KHrcLjgFvJzvTs27Xx22aurb5nc",
  "BvEpNTwxt6gv4599yYzW5Dq5sgg3cKQeHTK2F9qWWXMs",
  "FX8VqWT5Wf9Pg9AucdgVzDAEZmMGswDC2NJnAjYCXZz3",
  "9bQUBKBTF1DzqQL6tm6xoxnkrkpPbm8nW1SNYRgZjDcH",
  "2UJtqZN579epVJRFvE2pGNranKwfTaMJjBeGkRZkFHon",
  "U7LUyGDZCWYnk8o1TW8UWBkbEHfQ657NNB4DmgQoSCG",
  "9okkj9ueDsAfLqdJTQsa6fp1EYnUJbcazP3j2jGwpxLS",
  "7k7iSkduccqjberRVgLmCBxAcHr8YnXhnu8mxgeT22iz",
  "FB3iZJiD9ZvBkFPdf6qXd5YqJN2bsS4qkRMYJ16J557z",
  "H1vgmbsD4QkJVJpcHEC9Rp2ufLX36Pea4A3uSxwuW2D2",
  "KzA5kYRzEriTWe5KUgebrcXNGJw6FsfQkuwVgyU5NNp",
  "DouhABf6NiXrh478Qy8FANSZ6hWT7kmfT3qk3RrAWfkX",
  "xhLYdwRWjSMVBWdGLXSvKsuGyUaRgz7Z7ehh32KFxPk",
  "HTTpXHKFLXWuFnbBQEELqEv2EKnKY8KWVyRTmwg1fCeG",
  "8RMNrqN4oaUKxpdYAkFszAiRo7yP6JeoBdXBag25MJLn",
  "5gjaTiuSMnVj3YHiSVcGyERGxfPh11MeCEc6p8C7YBBz",
  "AyTvFsNKouhYgVV8E9stbvHdqB98ii38w7ZKd15iZpyb",
  "H8hP6cxBYYTfnwfJzraiUCQ6CAp1pxVTsLUvEJedXBw2",
  "FpFjniN8zQE8dzsRgmzTn6rMybDGGRv3gL8b4m6PRDXx",
  "BoURD7sY8HQKNtfVWPWhg7sr1SM1uNaLV5LhpBMRfMz5",
  "5JKmHWwLG55MSNFRzbYkLZqpzFq8QUy1oqJsdxZPDLLa",
  "F6tpSVw9FnByQ4PzzuXttTbLUQEFbZFGEH6T6SdnxgMJ",
  "EdY5DSJtz5C2nSBmozvmtgnB3fr7T1Gu78g17nwYmbbh",
  "5s6Vz52AyCEyJuSrmAVAGr3x9tWYG9CgzchTFgW3GtpP",
  "5xvLdx9xWThp9vvW8ZPsLjHKvt2iPLpvp2tMuBdgUggK",
  "2tUhsXPYKWZKo1XNbYVBWQBf3f71o7cUVJkg52opHBpv",
  "BVtiDDUPScSHDvadpvCTBknP5vHWFEoFsDUTS1kcrN2c",
  "GdVgyPfjreDG96ADTxeUYeYBmw4TFr5i4mTdkqaToTk3",
  "J7hAcfAFpcg4zaurHNXAXQkCVNXTsfH6Y7ctwoDCTooA",
  "ExVcFcUrc1quaVNXT9QPzYnLFqVqs89wmmRHg6NGyxfa",
  "6Ntzm5JUZ17Rs6MCLzigVKHQjpmh8EX339gUbRusbh44",
  "5H7cAx7cDoDP23AEMFzEqxBR1L1E8WsvZE3UYrzijTtU",
  "6vkXXEGg5wfK89KmhPw27B6e93q846PYdcCujhhgphCa",
  "FF2SkMe4AjVZSsewFm5VXNkWzTd2XhWPVXKwTw2QCzZZ",
  "BnsLvKCKkKMCL3NSVDBptAVdEmshY9b6xWX75KS6NDYq",
  "Dm1diaXY5MVciF5rcKtDzj2iKq1HD28VZFKVEt34AhZu",
  "Ho6oyqyaBeZoB74SKmVybcvTfruct1gCGPnSMLqg7zC4",
  "CmqGaSnHbYZotVdR5KCnM7eiRV1ErvgW6Wn6Fz46RUvU",
  "HuHYqQB7zjJgVAfJrFueNmqBv93LkHHg5NKFPcHAnrMV",
  "DUePDuwCRVHf1iZqwj4EgNQMkpJ6K77Wbdm7r9v2A6vd",
  "5RuLe1mjachzooz1cYafTQNDC3FJBCb6xQYf9Ui2kwGt",
  "AiW5jKo5gEXAiCNkYSbzePRteERT5AuPTRTfbnuKdFQV",
  "Hb7J9nhQZBzeAk35M6TgW3Bbbh4kp9sCGoQEdodNsByD",
  "FATwKFXeqDfKkBWMsFibyH7CMZbmgDcSpfHLmXjCgN4P",
  "4vDSCTvdwxvCfod6subjR6LdoKnwJTtSLsEyEcPuR8K7",
  "CDSVLSttLJykpe7hMuMkgRrBuhD4gQyvpmcfPwNpT1nk",
  "2SdmFHVrVS1B9it16geQ8LRfqKaPvrRM3rF5NGFtk7Na",
  "5imUUH2UowUQ8M3rbXMQW5a6KiicG8s3Qn13Td54EQRB",
  "14BAbBAby4rjo9VHBNLGiAknjQMuZn4JBv8FFYoxSXK4",
  "ChGfTj9TV4wAT5CB1zm5AsJMAHrQ7tBdfgZiyDcFeLD",
  "HdWWgU27zXGEWUnNz2Jvh6SggUcw5gQSgR6qmUPVR3Lf",
];

const TOKEN_PUBKEY = new web3.PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export type Panda = {
  image: string;
  attributes: { trait_type: string; value: string }[];
  name: string;
  holder: string;
};

export const getNftOwner = async (
  connection: web3.Connection,
  pandas: Panda[],
  listOfUniqueOwners: string[],
  address: string
) => {
  let filter = {
    memcmp: {
      offset: 0,
      bytes: address,
    },
  };
  let filter2 = {
    dataSize: 165,
  };
  let getFilter = [filter, filter2];
  let programAccountsConfig = { filters: getFilter, encoding: "jsonParsed" };
  let _listOfTokens = await connection.getParsedProgramAccounts(
    TOKEN_PUBKEY,
    programAccountsConfig
  );

  let res;

  const listOfTokens = _listOfTokens.filter(
    (token: any) =>
      token["account"]["data"]["parsed"]["info"]["tokenAmount"]["amount"] == 1
  );

  await Promise.all(
    listOfTokens.map(async (token: any) => {
      if (
        !listOfUniqueOwners.includes(
          token["account"]["data"]["parsed"]["info"]["owner"]
        )
      ) {
        listOfUniqueOwners.push(
          token["account"]["data"]["parsed"]["info"]["owner"]
        );
      }

      // get metadata account that holds the metadata information
      const m = await metadata.getMetadataAccount(
        token["account"]["data"]["parsed"]["info"]["owner"]
      );

      // get the account info for that account
      const accInfo = await connection.getAccountInfo(metadata.toPublicKey(m));

      const decoded = metadata.decodeMetadata(accInfo!.data);

      const uri = decoded.data.uri;

      const arweaveMetadata = await axios.get(uri);

      const panda: Panda = {
        name: arweaveMetadata.data.name,
        attributes: arweaveMetadata.data.attributes,
        image: arweaveMetadata.data.image,
        holder: token["account"]["data"]["parsed"]["info"]["owner"],
      };

      arweaveMetadata.data.attributes.map((attribute: any) => {
        if (attributes[attribute.value]) {
          attributes[attribute.value] = attributes[attribute.value] + 1;
        } else {
          attributes[attribute.value] = 1;
        }
      });

      pandas.push(panda);

      res = token["account"]["data"]["parsed"]["info"]["owner"];
    })
  );
  return res;
};

export type Snapshot = {
  pandas: Panda[];
  list: { mint: string; holder: string | undefined }[];
  uniqueOwners: number;
};
export const getSnapshot = async (
  connection: web3.Connection
): Promise<Snapshot> => {
  let listOfUniqueOwners: string[] = [];
  const pandas: Panda[] = [];
  let newList: { mint: string; holder: string | undefined }[] = [];

  await Promise.all(
    input.map(async (d: string) => {
      const holder = await getNftOwner(
        connection,
        pandas,
        listOfUniqueOwners,
        d
      );
      newList.push({ mint: d, holder: holder });
    })
  );

  return {
    pandas: pandas,
    list: newList,
    uniqueOwners: listOfUniqueOwners.length,
  } as Snapshot;
};

export const getPandasForAddress = async (
  connection: web3.Connection,
  address: web3.PublicKey
): Promise<Panda[]> => {
  const pandas: Panda[] = [];
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    address,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  await Promise.all(
    tokenAccounts.value.map(async (tokenAccount) => {
      try {
        if (tokenAccount.account.data.parsed.info.tokenAmount.amount === "0") {
          return;
        }
        const m = await metadata.getMetadataAccount(
          tokenAccount.account.data.parsed.info.mint
        );

        // get the account info for that account
        const accInfo = await connection.getAccountInfo(
          metadata.toPublicKey(m)
        );

        if (accInfo) {
          const decoded = metadata.decodeMetadata(accInfo!.data);

          const uri = decoded.data.uri;

          const arweaveMetadata = await axios.get(uri);

          if (
            !arweaveMetadata ||
            !arweaveMetadata.data ||
            !arweaveMetadata.data.name ||
            !arweaveMetadata.data.name.includes("Panda")
          ) {
            return;
          }

          const panda: Panda = {
            name: arweaveMetadata.data.name,
            attributes: arweaveMetadata.data.attributes,
            image: arweaveMetadata.data.image,
            holder: address.toString(),
          };

          pandas.push(panda);

          arweaveMetadata.data.attributes.map((attribute: any) => {
            if (attributes[attribute.value]) {
              attributes[attribute.value] = attributes[attribute.value] + 1;
            } else {
              attributes[attribute.value] = 1;
            }
          });
        }
      } catch (e) {
        console.log(e);
      }
    })
  );

  return pandas;
};

const attributes: any[] = [];
