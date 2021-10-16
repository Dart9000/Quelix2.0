const remInQueCon = $("#remInQue");
const userPosCon = $("#userPos");
const nexTurnCon = $("#nexTurn");
var A1= new Audio('/asset/1.mp3');
var A2= new Audio('/asset/2.mp3');

const url = "/queue/data/"+queueCode;

setInterval(() => {
		$.ajax({
      type : 'GET',
      url : url,
      success: function (data) {
        remInQueCon.html(data.queueLength);
        userPosCon.html(data.userPos);
        nexTurnCon.html(data.nexTurn);
        if(data.userPos==1){
					A1.play();
				}
				if(data.userPos==2){
					A2.play();
				}
			}
		});
}, 5000);
