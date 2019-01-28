$(function(){
  $('#btn-refresh').click(function(){
    console.log('click');
    $.post('/Graph',function(data, status){
      console.log(status);
      $('#Graph').html(data);
    }) ;
  }) ;
}) ;
