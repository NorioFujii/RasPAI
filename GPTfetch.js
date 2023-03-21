var obj=GPTwin, response, answer, ousyuu = [];
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

  const requestOptions = {
       "method": "POST",
      "headers": {
          "Content-Type": "application/json",
         "Authorization": OPENAI_API_KEY
      },
         "body": JSON.stringify({
          "model": "gpt-3.5-turbo",
         "stream": stream,    // true or false
       "messages": ousyuu.slice(ousyuu.length-10) // �ߋ��X�������ꏏ�ɒ񎦂���i��b���[�h�j
      })
  }
  let resp = await fetch(URL, requestOptions);
  if (!stream) answer = (await resp.json())["choices"][0]["message"]["content"].trim();  // stream=false
  else {
      console.log("Stream mode");
      answer = obj.document.getElementById('ans2').innerHTML;
      // ReadableStream �Ƃ��Ďg�p
      const reader = resp.body?.getReader();
      if (resp.status !== 200 || !reader) return "error";
      const decoder = new TextDecoder('utf-8');
      try {
         // ���� read �ōċN�I�Ƀ��b�Z�[�W��ҋ@���Ď擾
	 const read = async () => {
		const { done, value } = await reader.read();
		if (done) return reader.releaseLock();

		const chunk = decoder.decode(value, { stream: true });
		const jsons = chunk
		        // �����i�[����Ă��邱�Ƃ����邽�� split ����
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
      // ReadableStream ���Ō�͉������
      reader.releaseLock();
      answer = obj.document.getElementById('ans2').innerHTML;
  }
  let htmlans = answer.replace(/\r?\n/g,"<br>").replace(/<br><br>/g,"<br>")+"<br><br>";
  if (converse) {  // ��b�̔����L�^�͂P�g�[�N�Q�i���܂�
      let secpos = htmlans.indexOf('<br>');
      secpos += htmlans.slice(secpos).indexOf('<br>');
      ousyuu.push({"role": "assistant", "content": htmlans.slice(0,secpos)});
  }
  obj.document.getElementById('ans1').innerHTML += "<br>"+htmlans;
  obj.document.getElementById('ans2').scrollIntoView(false);
  obj.document.getElementById('ans2').innerHTML = "";
}
