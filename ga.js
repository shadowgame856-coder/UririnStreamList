// Google Analytics 4 設定
// 由 index.html 的 <head> 引入，緊接在 Google 官方載入程式（gtag/js）的下一行
// 測量 ID 寫在兩個地方，要換的話兩邊都要改：
//	1. index.html 裡 gtag/js?id= 後面
//	2. 本檔案最下面的 gtag('config', …)

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// 站長自己的瀏覽標成內部流量，GA 的「Internal Traffic」資料篩選器會把它排除
// 用 ?internal=1 打開網站一次，這個瀏覽器就會記住；用 ?internal=0 打開一次取消
(function(){
	let isInternal = false;
	try{
		const params = new URLSearchParams(window.location.search);
		const flag = params.get('internal');
		if(flag === '1'){
			localStorage.setItem('ga_internal', '1');
			alert('已將這個瀏覽器標記為站長，之後的瀏覽不會計入 Google Analytics 統計');
		}else if(flag === '0'){
			localStorage.removeItem('ga_internal');
			alert('已取消站長標記，之後的瀏覽會正常計入 Google Analytics 統計');
		}
		if(flag !== null){
			// 把 ?internal=… 從網址列拿掉，不留在網址裡，也不會被 GA 記錄到
			params.delete('internal');
			const query = params.toString();
			history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
		}
		isInternal = localStorage.getItem('ga_internal') === '1';
	}catch(e){} // 瀏覽器不允許存資料時，當作一般訪客
	window.GA_IS_INTERNAL = isInternal;
})();

gtag('config', 'G-QP5S6ESL3K', window.GA_IS_INTERNAL ? { traffic_type: 'internal' } : {});
