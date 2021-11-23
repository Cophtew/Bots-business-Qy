let LIB_PREFIX = 'REFLIB_';

let trackOptions = {};

function emitEvent(eventName, prms = {}){
  let evenFun = trackOptions[eventName]
  if(evenFun){
    evenFun(prms)
    return true;
  }
}

function getProp(propName){
  return User.getProperty(LIB_PREFIX + propName);
}

function getJsonRefList(userId){
  let propName = LIB_PREFIX + 'refList' + userId;
  let refList = Bot.getProperty(propName);

  if(!refList){ refList = { users:[] } };
  return refList.users;
}

function getRefList(userId){
  let listName = LIB_PREFIX + 'refList' + userId;
  let refList = new List({ name: listName, user_id: userId })

  list.recount()

  if(refList.total()==0){
    return getJsonRefList(userId)
  }

  return list.getUsers()
}

function addFriendFor(userId){
  // save RefList
  let listName = LIB_PREFIX + 'refList' + userId;
  let refList = new List({ name: listName, user_id: userId })

  refList.addUser(user);
}

function setReferral(userId){
  addFriendFor(userId);

  let userKey = LIB_PREFIX + 'user' + userId;
  let refUser = Bot.getProperty(userKey);

  User.setProperty(LIB_PREFIX + 'attracted_by_user', refUser, 'json');
  if(emitEvent('onAtractedByUser', refUser )){ return }
  emitEvent('onAtracted', refUser)
}

function isAlreadyAttracted(){
  return getProp('attracted_by_user') || getProp('old_user')
}

function trackRef(){
  let prefix = 'user'

  let uprefix = Bot.getProperty(LIB_PREFIX + 'refList_link_prefix');
  if(uprefix){ prefix = uprefix  }

  let arr = params.split(prefix);
  if(arr[0]!=''){ return }
  let userId=arr[1];
  if(!userId){ return }

  // own link was touched
  if(userId==user.id){ return emitEvent('onTouchOwnLink') }

  // it is affiliated by another user
  return setReferral(userId);
}

function getTopList(top_count=10){
  // TODO: make add quickly TopList
  return []
}

function clearRefList(){
  // TODO
}

function attractedByUser(){
  return getProp('attracted_by_user')
}

function attractedByChannel(){
  // DEPRECATED - need remove all props
  return getProp('attracted_by_channel')
}

function getRefLink(botName, prefix){
  if(!prefix){
    prefix = 'user'
  }else{
    Bot.setProperty(LIB_PREFIX + 'refList_' + 'link_prefix', prefix, 'string');
  }

  if(!botName){ botName = bot.name }

  user.chatId = chat.chatid;
  let userKey = LIB_PREFIX + 'user' + user.id;
  Bot.setProperty(userKey, user, 'json');

  return 'https://t.me/' + botName + '?start=' + prefix + user.id;
}

function isDeepLink(){
  return (message.split(' ')[0]=='/start')&&params;
}

function track(_trackOptions={}){
  trackOptions = _trackOptions;

  if(isAlreadyAttracted() ){
    return emitEvent('onAlreadyAttracted');
  }

  if(!isDeepLink()){
    return User.setProperty(LIB_PREFIX + 'old_user', true, 'boolean');
  }

  trackRef();
}

publish({
  currentUser:{
    getRefLink: getRefLink,
    track: track,
    refList:{
      get: getRefList,
      clear: clearRefList
    },
    attractedByUser: attractedByUser,
    attractedByChannel: attractedByChannel
  },
  topList:{
    get: getTopList,
    clear: clearTopList
  }
})