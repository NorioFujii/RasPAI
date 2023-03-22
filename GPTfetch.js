var obj=GPTwin, response, answer, ousyuu = [];
function rtrim(str) {
	return (str.lastIndexOf(' ')<0)? str : rtrim(str.substr(0,str.lastIndexOf(' ')));
}
async function chatTxt() {
	let text = rtrim(document.getElementById('sentence').value);
	if (text=='') return false;
        navigator.clipboard.writeText(text);
        let stream = document.getElementById('Stream').checked;
        let converse = document.getElementById('Conver').checked;
	let URL="https://api.openai.com/v1/chat/completions",i,invalue="";
        obj.document.getElementById('ans1').innerHTML += '<font color=green>'+text+'</font>';
        if (!converse) ousyuu = [];
        ousyuu.push({"role": "user", "content": text});
        OPENAI_API_KEY = "Bearer "+document.getElementById('account').value;
        if (OPENAI_API_KEY.length<30) alert("API Key is needed.");

  const requestOptions = {
       "method": "POST",
      "headers": {
          "Content-Type": "application/json",
         "Authorization": OPENAI_API_KEY
      },
         "body": JSON.stringify({
          "model": "gpt-3.5-turbo",
         "stream": stream,    // true or false
       "messages": ousyuu.slice(ousyuu.length-10) // 過去９発言を一緒に提示する（会話モード）
      })
  }
  let resp = await fetch(URL, requestOptions);
  if (!stream) answer = (await resp.json())["choices"][0]["message"]["content"].trim();  // stream=false
  else {
      console.log("Stream mode");
      answer = obj.document.getElementById('ans2').innerHTML;
      // ReadableStream として使用
      const reader = resp.body?.getReader();
      if (resp.status !== 200 || !reader) return "error";
      const decoder = new TextDecoder('utf-8');
      try {
         // この read で再起的にメッセージを待機して取得
	 const read = async () => {
		const { done, value } = await reader.read();
		if (done) return reader.releaseLock();

		const chunk = decoder.decode(value, { stream: true });
		const jsons = chunk
		        // 複数格納されていることもあるため split する
			.split('data:')
			.map((data) => {
			    const trimData = data.trim();
			    if (trimData === '') return undefined;
			    if (trimData === '[DONE]') return undefined;
                            if (trimData.indexOf('"content":')>0) {
                                response = JSON.parse(trimData)["choices"][0]["delta"]["content"];
                                answer += response.replace(/\r?\n\r?\n/g,"<br>").replace(/\r?\n/g,"<br>");
                                obj.document.getElementById('ans2').innerHTML = answer;
                                obj.document.getElementById('ans2').scrollIntoView(false);
			    } else answer = "";
                            return response;
			})
			.filter((data) => data);
//                console.log(jsons);
		return read();
          };
	  await read();
      } catch (e) {
	  console.error(e);
      }
      // ReadableStream を最後は解放する
      reader.releaseLock();
      answer = obj.document.getElementById('ans2').innerHTML;
  }
  let htmlans = answer.replace(/\r?\n/g,"<br>").replace(/<br><br>/g,"<br>")+"<br><br>";
  if (converse) {  // 会話の発言記録は１トーク２段落まで
      let secpos = htmlans.indexOf('<br>');
      secpos += htmlans.slice(secpos+4).indexOf('<br>');
      ousyuu.push({"role": "assistant", "content": htmlans.slice(0,secpos+4)});
  }
  obj.document.getElementById('ans1').innerHTML += 
　        (htmlans.slice(0,4)=="<br>"?"":"<br>")+htmlans;
  obj.document.getElementById('ans2').scrollIntoView(false);
  obj.document.getElementById('ans2').innerHTML = "";
}
