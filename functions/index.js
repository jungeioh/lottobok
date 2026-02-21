const functions = require("firebase-functions");
const axios = require("axios");
const cheerio = require("cheerio");

/**
 * 한글 금액 파싱 (예: "40억6637만5179원" → 40663750179)
 * @param {string} str 한글 금액 문자열
 * @return {number} 파싱된 금액
 */
function parseKoreanAmount(str) {
  let total = 0;
  const eok = str.match(/(\d+)억/);
  const man = str.match(/(\d+)만/);
  const won = str.match(/만(\d+)원/) || str.match(/억(\d+)원/);
  if (eok) total += parseInt(eok[1]) * 100000000;
  if (man) total += parseInt(man[1]) * 10000;
  if (won) total += parseInt(won[1]);
  return total;
}

exports.getLottoResult = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const drwNo = req.query.drwNo;
  if (!drwNo) {
    res.status(400).json({error: "drwNo parameter is required"});
    return;
  }

  try {
    const url = `https://superkts.com/lotto/${drwNo}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const metaDesc = $("meta[name=\"description\"]").attr("content") || "";

    // 메타 설명: "1155회 로또는 2025년 1월 18일에 추첨하였고
    // 당첨번호는 10,16,19,27,37,38 보너스 13 입니다.
    // 1등 당첨자는 7명이며 40억6637만5179원씩 당첨금을 받았습니다."
    const numMatch = metaDesc.match(
        /당첨번호는\s*([\d,]+)\s*보너스\s*(\d+)/,
    );
    if (!numMatch) {
      res.status(404).json({
        returnValue: "fail",
        error: "해당 회차 데이터를 찾을 수 없습니다.",
      });
      return;
    }

    const numbers = numMatch[1].split(",").map(Number);
    const bonus = parseInt(numMatch[2]);

    // 날짜 추출
    const dateMatch = metaDesc.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    let drwNoDate = "";
    if (dateMatch) {
      drwNoDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-` +
        `${dateMatch[3].padStart(2, "0")}`;
    }

    // 1등 당첨자 수
    const winnerMatch = metaDesc.match(/1등 당첨자는\s*(\d+)명/);
    const firstPrzwnerCo = winnerMatch ? parseInt(winnerMatch[1]) : 0;

    // 1등 당첨금
    const prizeMatch = metaDesc.match(/(\d+[억만원\d]+)씩/);
    let firstWinamnt = 0;
    if (prizeMatch) {
      firstWinamnt = parseKoreanAmount(prizeMatch[1]);
    }

    res.json({
      returnValue: "success",
      drwNo: parseInt(drwNo),
      drwNoDate,
      drwtNo1: numbers[0],
      drwtNo2: numbers[1],
      drwtNo3: numbers[2],
      drwtNo4: numbers[3],
      drwtNo5: numbers[4],
      drwtNo6: numbers[5],
      bnusNo: bonus,
      firstWinamnt,
      firstPrzwnerCo,
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

exports.recommendLotto = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const maxDraw = 1160;
    const frequency = {};

    for (let i = 1; i <= 45; i++) {
      frequency[i] = 0;
    }

    for (let draw = 1; draw <= maxDraw; draw++) {
      const url = `https://superkts.com/lotto/${draw}`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const metaDesc = $("meta[name=\"description\"]").attr("content") || "";
      const numMatch = metaDesc.match(
          /당첨번호는\s*([\d,]+)\s*보너스\s*(\d+)/,
      );

      if (numMatch) {
        const numbers = numMatch[1].split(",").map(Number);
        numbers.forEach((num) => {
          frequency[num]++;
        });
      }
    }

    const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map((item) => parseInt(item[0]));

    const recommended = sorted.slice(0, 6);

    res.json({
      recommended,
      frequency,
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
