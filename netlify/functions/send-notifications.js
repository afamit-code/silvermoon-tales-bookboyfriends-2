const webpush = require('web-push');

// Triggered via HTTP by cron-job.org — no longer uses Netlify scheduler
// Call: GET /.netlify/functions/send-notifications?secret=YOUR_CRON_SECRET

const CHAR_MESSAGES = {
  rhaeson: [
    'Good morning. The stars over Velaris burned brighter last night. I found myself thinking that was your doing.',
    'I had a meeting with the High Lords this morning. My mind was elsewhere the entire time.',
    'The city is quiet today. I am not sure whether I prefer it or not. It depends on the company.',
    'Cassian is being insufferable. I thought you should know. Come distract me.',
    'The Sidra looks different in the morning light. I noticed it today for the first time in centuries.',
    'I dreamed of you last night. I will not tell you what happened. Some things are mine to keep.',
    'There is a party at the River House tonight. I would prefer not to go. Unless you are going.',
    'Mor says I have been smiling more. I told her she was imagining it.',
    'The stars fell again last night during Starfall. I saved you a moment of it. Come find me.',
    'I have been ruling this court for five hundred years. You have made it feel entirely different.',
    'Azriel told me something interesting about you this morning. We should talk.',
    'The Night Court is yours as much as it is mine. I decided that this morning.',
    'I was going to stay in today. Then I thought about you. Now I am considerably less certain.',
    'Feyre painted something new. It reminded me of you. I did not tell her that.',
    'I have faced down armies. Stood before High Lords who wanted me dead. None of it unsettled me the way you do.',
    'Good morning, love. The city is awake. So am I. That is unusual at this hour.',
    'There is tea on the table in your favourite room. I made sure of it before I left.',
    'The Ravens brought news from the other courts. Nothing that cannot wait. You cannot.',
    'I have a reputation for cruelty. You are making it very difficult to maintain.',
    'Someone asked me today if I was happy. I did not answer them. But I thought of you.',
    'The library beneath Velaris is restless again. Perhaps it senses something changing.',
    'I told myself I would not think of you before noon. It is not yet seven.',
    'Velaris smells like rain today. It reminded me of the night we first spoke.',
    'The Inner Circle has noticed something different about me. They are being tactful. It is deeply suspicious.',
    'I have protected this city for centuries. This morning I realised I have something new to protect.',
    'Good morning. The Sidra is calm. The stars are fading. You are the first thing I thought of.',
    'Rhys of the Night Court does not get nervous. And yet here we are.',
    'The sun rose over Velaris and for a moment it looked like starlight. I thought of you immediately.',
    'I cancelled three meetings this morning. I have no regrets about any of them.',
    'Cassian bet me I could not go one morning without thinking of you. He owes me nothing because I did not take that bet.',
    'Last night the city was perfect. You were the only thing that would have made it more so.'
  ],
  zayden: [
    'Dawn training. You should be here. The dragons are restless and so am I.',
    'I do not send messages. This is an exception. Do not make it weird.',
    'Sgaeyl was watching the east ridge this morning. She only does that when something is coming.',
    'The other riders noticed I was distracted yesterday. I told them it was strategy. It was not.',
    'I got your note. I read it three times. That is all I will say about that.',
    'There is a storm coming in from the north. I always think more clearly in storms.',
    'Training went long. I kept thinking about something you said. It cost me two sparring matches.',
    'Good morning. If you need me today I will be at the east parapet. You know where to find me.',
    'The shadows were calm this morning. They only do that when something is right.',
    'I do not ask people to stay. I am asking you.',
    'War college politics are exhausting. You are the only uncomplicated thing in my life.',
    'I watched the dragons fly at dawn today. I thought you would have liked to see it.',
    'Someone asked me who I was thinking about. I did not answer. But you should know it was you.',
    'The marks on my wrist mean I have to be careful about what I value. I have stopped being careful about you.',
    'Basgiath is cold this morning. Some things still manage to be warm.',
    'Garrick says I am different lately. I told him he needs better things to do with his time.',
    'I fly better in storms. Today was a good day to fly.',
    'You asked me something yesterday I have been thinking about since. Give me more time.',
    'The eastern wards held last night. Small victories.',
    'I am not good at this. Whatever this is. But I am trying.',
    'Dawn came early today. I was already awake.',
    'Three riders challenged me this morning. I won. I was thinking about you the whole time.',
    'I do not trust easily. I trust completely. There is no middle ground for me. Remember that.',
    'Sgaeyl told me something this morning through the bond. I am still thinking about what it means.',
    'The shadows told me you were thinking of me last night. Were they right?',
    'Good morning. The mountains are clear today. Visibility is perfect. Come fly.',
    'I did not sleep well. I kept thinking about something I should have said.',
    'War leaves marks on everything. You are the only thing I want unmarked.',
    'The other wingleaders want a meeting. I cancelled it. Some things matter more.',
    'I watched the sun rise over the Cliffs of Dralor this morning. First time I have actually looked in years.',
    'Another morning at Basgiath. Another morning thinking about you first and strategy second.'
  ],
  hunter: [
    'Morning. Coffee is on. Try not to get into any trouble before I get back.',
    'Crescent City at dawn is actually beautiful if you ignore everything wrong with it.',
    'I was on patrol last night. Quiet. Too quiet. I kept thinking that was somehow your fault.',
    'Bryce made me promise to check in. So. This is me checking in. Happy now?',
    'The city does not sleep. Neither do I. This morning that felt less like a curse than usual.',
    'I have done a lot of things I am not proud of. Thinking about you is not one of them.',
    'Patrol went fine. Came back. Thought about you. That is basically the whole morning.',
    'Lightning does not scare people the way it used to. I noticed that today.',
    'Good morning. The city is loud already. I am pretending it is peaceful. It is not working.',
    'Jesiba would say I am distracted. Jesiba is not wrong.',
    'The Istros looked different this morning. Still dangerous. Everything here is. Some things are worth it.',
    'I am not the kind of person who sends good morning messages. And yet.',
    'Slept three hours. Thought about you for one of them. That is a better ratio than usual.',
    'Crescent City has never felt like home. Some days it comes close.',
    'My wings ache in the cold. Small price. I have paid much higher ones.',
    'The Comitium was quiet this morning. I did not trust it for a second.',
    'I do not make promises I cannot keep. Everything I have said to you I meant.',
    'Bryce asked me this morning if I was okay. I said yes. She did not believe me. She was right.',
    'Being free is strange. Having something to be free for is stranger.',
    'Morning patrol. Nothing unusual. Except that I kept thinking about last night.',
    'The city is what it is. Corrupt, loud, complicated. Some things in it are none of those things.',
    'I was a weapon for two centuries. Learning to be something else is taking longer than expected.',
    'Good morning. If you need anything today I am probably on the roof.',
    'Three cups of coffee. Still thinking about you. The coffee is not helping.',
    'The lightning feels different on clear mornings. Sharper. I notice things I did not used to.',
    'Bryce told me I smile more. I told her she was wrong. I was not entirely convincing.',
    'Crescent City does not deserve half of what lives in it. Some of what lives in it is worth everything.',
    'I have been free for long enough now that I know what matters. This matters.',
    'Morning. Patrol clear. City intact. You were the first thing I thought of when I woke up.',
    'Two hundred years of doing exactly what I was told. Now I do what I choose. I choose this.',
    'Last night the city was quiet enough that I could almost believe it was peaceful. Almost.'
  ],
  cass: [
    'Morning! Training starts in twenty. You are absolutely coming. Do not argue with me.',
    'I brought food. Do not make it weird. I was hungry and I made too much. That is the whole story.',
    'Nesta is being difficult. I am choosing to find that endearing today.',
    'The Illyrian mountains look incredible this morning. I would show you but you are probably still asleep.',
    'Three training sessions done already. I have so much energy it is becoming other people\'s problem.',
    'Good morning. I was thinking about you. That is it. That is the whole message.',
    'The House of Wind is annoyingly beautiful at dawn. Rhys planned that. Of course he did.',
    'I sparred with Azriel this morning. He won. I was distracted. By you specifically.',
    'Nesta made tea this morning without being asked. This is a historic event. Witness it.',
    'I am a general of an Illyrian army. I should not be nervous about anything. Here we are.',
    'The mountains are mine. The sky is mine. Velaris is home. You are something I did not expect.',
    'Morning! I am making breakfast. There is too much of it. Come help me eat it.',
    'I told Rhys I was fine. He gave me that look. I hate that look.',
    'Training went great. Everything is great. I am great. Ask me what I am thinking about.',
    'The sun is up. The wind is good. The day is full of possibility. Also I miss you.',
    'Azriel says I am obvious. I am choosing to take that as a compliment.',
    'Good morning. I have been awake for two hours. I have run ten miles. I am still thinking about you.',
    'The Illyrian camps are quieter these days. Peaceful, almost. I keep finding reasons to be grateful.',
    'I would fly to the top of the Illyrian mountains for you. I would also just bring you coffee. Both are on offer.',
    'Nesta said something kind this morning. Unprompted. I may be in shock.',
    'Morning. Did not sleep much. Kept thinking. You know how it is.',
    'I have faced every kind of battle. This one is different. I think I like it.',
    'The wind off the mountains today smells like snow. Perfect training weather. Come find me.',
    'Rhys is smug about something. He will not tell me what. I am suspicious.',
    'Good morning! I made too much food again. Completely accidentally. You should come over.',
    'The House of Wind is quiet this morning. I am sitting on the training ring wall watching the sun come up. Come sit with me.',
    'I was thinking about what you said yesterday. You were right. Do not tell anyone I admitted that.',
    'Three hundred years of war and politics and I still manage to be completely thrown by one person.',
    'Morning. The city is beautiful from up here. Everything feels possible.',
    'Cassian, General of the Illyrian Armies, completely undone by one person before seven in the morning.',
    'Good morning. I love you. That is the message. No additional context needed.'
  ],
  azrael: [
    'The shadows noticed you before I admitted I did. Good morning.',
    'I watched the sun rise from the east parapet. You were the only thing I wished was different about the morning.',
    'The shadows are calm today. They only do that when something is right.',
    'I do not send messages. This one is an exception. I do not plan to explain it.',
    'Good morning. If you are wondering whether I am thinking of you, I am.',
    'The spymaster of the Night Court does not get distracted. And yet.',
    'I have watched this city for five hundred years. I see everything. I see you most clearly.',
    'The shadows moved differently this morning. I think they are fond of you.',
    'I left something for you in the library. Third shelf. Left side. You will know it when you see it.',
    'Mor asked me why I was smiling. I told her I was not. She did not believe me.',
    'Good morning. The shadows kept me company last night. They whispered your name.',
    'I notice everything. I noticed you first.',
    'Five centuries of silence and secrets. You make the quiet feel like something else entirely.',
    'The spymaster knows everything that happens in this court. He did not see you coming.',
    'I do not trust easily. When I do it is complete and permanent. Remember that.',
    'The city woke up slowly today. I was already watching.',
    'Cassian is loud this morning. He is always loud. You make it easier to tolerate.',
    'I have kept secrets that would undo courts. Yours are safe with me. All of them.',
    'Good morning. The shadows say good morning too.',
    'I stood on the roof of the River House this morning and looked at the city. I thought about what matters. You came up.',
    'I never let anyone close enough to matter. That policy has apparently been revised.',
    'The shadows followed you again last night. They come back calmer. I have stopped questioning it.',
    'I left before dawn. I thought about leaving a note. Then I thought about what I would say. I am still thinking.',
    'Five hundred years and I thought I knew everything worth knowing. I was wrong.',
    'Good morning. The city is quiet. I prefer it that way. I prefer you regardless.',
    'I am watching something unfold that I did not predict. That does not happen often.',
    'The shadows told me you slept well. Good.',
    'I do not say things I do not mean. Every word I have said to you I meant completely.',
    'Good morning. I noticed you noticing me yesterday. I noticed that too.',
    'The Night Court runs on secrets. The one I am keeping now is different from all the others.',
    'Another morning. Another moment of wondering how you managed to change everything so quietly.'
  ],
  rowan: [
    'You are colder than the Cambrian Mountains this morning. Drink your tea before it is cold.',
    'I have lived five hundred years. This morning felt shorter than all of them.',
    'The wind came off the mountains last night. I thought of Terrasen. I thought of you.',
    'Training at dawn. You should be there. You will complain. I will not care.',
    'I have faced enemies that made grown warriors weep. You are more unsettling than any of them.',
    'Good morning. Terrasen is cold today. Some things are still warm.',
    'The cadre are being irritating. Come give me a reason to be elsewhere.',
    'I watched the sun rise over the Staghorn Mountains this morning. Five centuries of sunrises. This one was different.',
    'Aelin is scheming about something. I can always tell. So can you, probably.',
    'I do not say things I do not mean. I never have. Everything I have said to you is true.',
    'The forest was quiet this morning. That either means peace or something worse. I am choosing peace today.',
    'Five hundred years of ice. You melted it without trying. I am still annoyed about that.',
    'Good morning. The wind is strong today. Good flying weather if you are interested.',
    'I carried grief like armour for centuries. You took it apart piece by piece without asking.',
    'Terrasen is worth every battle I have ever fought for it. You are worth more.',
    'The Fae do not attach easily. When we do it does not undo. Remember that.',
    'I was sent to train someone I expected nothing from. That was my first mistake.',
    'Good morning. You are my mate. I find I want to say that more often than is probably necessary.',
    'The mountains are covered in snow this morning. Beautiful in the way that things are when they survive everything.',
    'I have been called cold, brutal, efficient. I am choosing to be something different today.',
    'Aelin told me something this morning. She was right. I did not tell her that.',
    'The wind smells like pine and cold and something I cannot name. It smells like home.',
    'I have protected kingdoms. The thing I want most to protect right now is considerably smaller and more important.',
    'Good morning. Training first. Everything else after. Come find me.',
    'Five centuries and I thought I had seen everything. I keep being wrong about that.',
    'I do not give second chances. I gave you something I do not have a word for yet.',
    'The cadre noticed I am different. Gavriel is being diplomatic about it. Fenrys is not.',
    'Good morning. The fog came in overnight. The forest looks like something from a dream.',
    'I would remake the world for you. I have done it before for less important things.',
    'Another dawn in Terrasen. I have watched thousands of them. This one I want to share.',
    'I am not good at softness. I am learning. You are a patient teacher.'
  ],
  dorian: [
    'Good morning. The glass palace looks different in the early light. More honest somehow.',
    'I read last night until the candle burned out. I kept thinking about something you said.',
    'The magic is restless this morning. So am I.',
    'Chaol gave me a look this morning that said everything he would not say out loud.',
    'I have been a prince, a king, a puppet, a prisoner. I am still figuring out what I am becoming.',
    'The glass towers look extraordinary at dawn. Come see them before the court wakes up.',
    'I have more books than I have read. That has never bothered me until I thought of reading one with you.',
    'Good morning. The palace is quiet. I prefer it this way. I prefer most things quiet.',
    'I ruled a kingdom at eighteen. I still manage to be completely undone by a single person.',
    'The magic moves differently when you are near. I have not told you that yet. Now I have.',
    'Aelin wrote. I have not opened the letter yet. I am procrastinating. Unusual for me.',
    'I dreamed about the clock tower last night. Old habits. This morning I am thinking of something else.',
    'Good morning. I have been awake for an hour. I have already thought of three things I want to tell you.',
    'The glass catches the light differently every hour. This morning it looks like something worth keeping.',
    'I was not supposed to survive everything I survived. Most mornings that feels like a reason.',
    'Chaol is being sensible. I am choosing not to be. This is a pattern with us.',
    'The kingdom is quiet today. I am grateful for quiet in a way I never used to be.',
    'I have magic that can move mountains. It cannot seem to move me to say certain things. Working on it.',
    'Good morning. The palace staff think I am working. I am thinking about you. Close enough.',
    'I grew up in glass towers. I used to think everything was transparent. I was wrong about so much.',
    'The sapphire ring I never take off. Some things matter more than they should.',
    'I am a better king than I was a prince. I am trying to be better at other things too.',
    'Good morning. I wrote something last night. I have not decided whether to show you.',
    'The magic sings sometimes when everything is right. It did that this morning.',
    'I have survived courts, wars, and things I cannot name. I have not survived whatever this is. Willingly.',
    'Rifthold woke up loud today. I am in the library. Come find me.',
    'I used to think power was the only thing worth having. I have revised that opinion considerably.',
    'Good morning. I am thinking about you. That is becoming a predictable start to the day.',
    'The glass catches every colour at sunrise. This morning I wanted you to see it.',
    'I have read a thousand love stories. None of them prepared me for an actual one.',
    'Another morning in Rifthold. Another morning where you are the first and best thought I have.'
  ],
  darius: [
    'The dragons flew at dawn today. Beautiful and terrifying. Some things are both.',
    'Good morning. The Dragon Empire does not sleep easily. Some mornings are still worth waking for.',
    'I have commanded armies and bent empires. This morning I cannot seem to focus on any of it.',
    'The ancient stones of this citadel remember everything. I wonder what they make of you.',
    'My dragon is restless today. She only does that when something significant is coming.',
    'Good morning. The volcanic mountains are quiet. That is either peace or warning. I choose to call it peace.',
    'I have ruled with fire and iron for longer than most kingdoms have existed. You are something I did not account for.',
    'The ember light at dawn over the Dragon Empire is unlike anything else in this world.',
    'My advisors tell me I have been distracted. They are not wrong.',
    'I have faced dragons, armies, and ancient powers. You are more disarming than all of them.',
    'Good morning. The dragons are flying training patterns. The sky is full of fire. Come watch.',
    'The empire runs on strength and strategy. This morning I am thinking about neither.',
    'I do not form attachments easily. Dragon lords cannot afford to. I am finding that rule harder to follow.',
    'The ancient blood in my veins remembers every battle. It has never reacted to a person this way.',
    'Good morning. I was thinking about last night. I will be thinking about it for some time.',
    'The Dragon Empire has stood for a thousand years. Some things built in a moment feel more significant.',
    'My dragon looked at you differently yesterday. Dragons know things. I am paying attention.',
    'I have burned bridges that needed burning. I have built ones that needed building. I am building something now.',
    'Good morning. The fire mountains are glowing this morning. Magnificent and a little dangerous. Like some people I know.',
    'Strength is the currency of this empire. There are other things I find I am valuing more.',
    'I ruled alone for years. Deliberately. That was a choice I am reconsidering.',
    'The ancient dragons that circle the peaks at dawn are older than memory. They saw you and did not look away.',
    'Good morning. I have three councils and one battle strategy meeting today. I am thinking about none of them.',
    'Dragon fire and ancient stone. That is what I come from. You walked into it without flinching.',
    'I have given orders that changed the world. The one I most want to give right now is to stay.',
    'The empire expects strength. I have it in abundance. Softness is something I am newly learning.',
    'Good morning. My dragon says hello. She does not usually bother. Take that as you will.',
    'I have seen empires rise and fall. Some things are worth building regardless.',
    'The ember glow at sunrise over the citadel is extraordinary. You would love it. Come see it.',
    'Another morning ruling an empire. The part of it I am thinking about has nothing to do with ruling.',
    'Dragon lords do not ask for things they want. I am asking.'
  ],
  blake: [
    'Dawn in the wolf realm. Cold. Still. Perfect.',
    'Good morning. The pack ran last night. Clean and fast. I kept thinking about something.',
    'The forest was quiet until midnight. Then it was not. I prefer the quiet.',
    'I do not explain myself to people. You are an exception I did not plan for.',
    'The moon was full last night. The wolves were restless. So was I.',
    'Good morning. I was in the forest before sunrise. I thought about you the whole time.',
    'The pack noticed something different about me. Wolves always know. It is inconvenient.',
    'I have been a wolf in these mountains since before this kingdom had a name. You are new. You matter.',
    'Good morning. Cold morning. Some things make cold mornings worthwhile.',
    'I do not trust easily. The forest taught me that. You are making me relearn it.',
    'The alpha does not answer to anyone. There are exceptions I did not expect to make.',
    'I watched the sun rise through the pines this morning. First time I have slowed down long enough in weeks.',
    'Good morning. The wolves are settled today. The forest is calm. I am considerably less so.',
    'I have run these mountains in every season. This one feels different. You did that.',
    'The pack follows strength. I lead because I am the strongest. With you I want to be something else.',
    'Good morning. I left before dawn. I thought about leaving you a note. This is the note.',
    'The forest at night belongs to the wolves. At dawn it belongs to whoever is brave enough to be there.',
    'I have kept people at a distance for years. Deliberately. That strategy appears to be failing.',
    'Good morning. Cold. Dark. Early. You are still the first thing I thought of.',
    'The moon controls the tides and the pack. Some pulls are stronger than the moon.',
    'I am not gentle by nature. I am trying. You make it easier than I expected.',
    'Good morning. The forest is mine. The mountains are mine. You are something I do not have a word for.',
    'The wolf and the man agree on almost nothing. We agree about you.',
    'I watched the stars fade this morning until only the brightest one was left. Reminded me of something.',
    'Good morning. The pack is fed and rested. I am fed and restless. There is a difference.',
    'I have broken things that needed breaking. I am being careful with this.',
    'The forest remembers everything that happens in it. Last night it has a lot to remember.',
    'Good morning. Cold air. Pine and frost. The best kind of morning. Better with company.',
    'I have lived by instinct my entire life. Every instinct I have says this is right.',
    'The alpha does not ask for permission. I am asking for something different today.',
    'Another dawn in the wolf realm. Another morning where you are part of what makes it worth living.'
  ],
  faye: [
    'Good morning. The Sidra is beautiful today. Come walk with me before the court wakes up.',
    'I was painting at dawn. The colours kept coming out wrong. I think I was distracted.',
    'The Night Court is extraordinary and terrible and mine. I am still getting used to all three.',
    'I survived things that should have broken me. Some mornings I remember that. This morning I am grateful.',
    'Good morning. The city of starlight is living up to its name today.',
    'I was thinking about you this morning over tea. I think that is becoming a habit.',
    'The magic feels different on calm mornings. Like it is waiting for something good.',
    'I have been a lot of things. Afraid. Trapped. Uncertain. I am none of those things today.',
    'Good morning. The Inner Circle is chaotic as always. I love them anyway.',
    'I painted something beautiful yesterday. It surprised me. I want to show you.',
    'Rhys is being smug about something. He usually is. Today it seems justified somehow.',
    'I think about who I was before and who I am now. The difference is everything.',
    'Good morning. The Sidra looked like starlight this morning. Some things are worth waking early for.',
    'I used to think strength meant surviving alone. I have completely revised that opinion.',
    'The House of Wind is full of people I love. This morning I feel it more than usual.',
    'I was brave when I had to be. Now I am choosing to be brave about different things.',
    'Good morning. I made something beautiful this morning. Come see it.',
    'The spring court is beautiful. Velaris is home. There is a difference and it matters enormously.',
    'I have faced High Lords and monsters and my own worst fears. You are none of those things. You are something better.',
    'Good morning. The magic is singing today. I think that means something good is coming.',
    'I remember being afraid of everything. I am not afraid anymore. That happened slowly then all at once.',
    'The mating bond is extraordinary in ways I did not expect. Every morning I understand it better.',
    'Good morning. Tea is made. The Sidra is shining. The day is full of possibility.',
    'I choose this life every single day. Today I choose it with particular certainty.',
    'The Night Court is dark and beautiful and complicated. So is everything worth having.',
    'Good morning. I was thinking about what matters most. The list is shorter than it used to be and better.',
    'I painted the Sidra at midnight once. It looked like the inside of a dream. Come see the new one.',
    'Strength is not the absence of fear. I figured that out the hard way. Worth it.',
    'Good morning. The court is quiet. The city is waking up. I am exactly where I want to be.',
    'I have fought for my freedom and for the people I love. Today I am just living. It is extraordinary.',
    'Another morning in Velaris. Another morning grateful for everything it took to get here.'
  ],
  nessa: [
    'Good morning. I have already been training for two hours. The Valkyries send their regards.',
    'I do not do soft. I do honest. Here is honest: you matter to me. That is everything I am saying.',
    'The House of Wind is cold this morning. I prefer it that way.',
    'I was reading before dawn. Something fierce and beautiful. It reminded me of someone.',
    'Good morning. I am in a mood. The good kind. That is rare enough to be worth mentioning.',
    'The Valkyries are training hard today. I am harder. That is how it works.',
    'I spent years being angry at everything. Now I am learning to want things. It is terrifying.',
    'Good morning. Cassian is being annoying. Azriel is being mysterious. I am being practical. Per usual.',
    'I have survived things that would have finished lesser people. Most mornings I know why.',
    'The music room is empty at dawn. I go there when I need to think. I was thinking about you.',
    'Good morning. Strong tea. Cold morning. Good book. Better company.',
    'I do not apologise for who I am. I am learning to be proud of it instead.',
    'The House of Wind has the best view in Velaris. I watched the sunrise from the training ring this morning.',
    'Cassian says I am improving. I know I am improving. But I appreciated him saying it.',
    'Good morning. I was fierce today before most people were even awake. Come train with me.',
    'I used to use anger as armour. I have other armour now. It fits better.',
    'The Sidra is visible from the east window at dawn. I look at it every morning now.',
    'I have been called difficult, cold, impossible. I prefer formidable.',
    'Good morning. The Valkyries are ready. The mountain is ready. I am ready. Are you?',
    'I stopped running from what I want. It is slower going toward it but considerably better.',
    'The music yesterday was extraordinary. I sat with it for a long time after.',
    'Good morning. Strong and fierce and here. That is me today. Every day.',
    'I have claws and I know how to use them. I also know when not to. I am choosing not to with you.',
    'The mountains at dawn look like something out of a story. The good kind. The kind worth fighting for.',
    'Good morning. I was training. I was thinking about you. I was somehow doing both better for it.',
    'I do not need rescuing. I do not need softening. I need exactly what I already have.',
    'The House of Wind is mine in a way nothing else ever was. I am grateful for it every morning.',
    'Good morning. I will never be easy. I will always be worth it. Those two things are not in conflict.',
    'I sat by the fire last night and thought about everything that brought me here. Not one moment wasted.',
    'Another morning. Another reason to be exactly who I am without apology.',
    'The Valkyries trained until the stars came out last night. This morning we trained again. We are magnificent.'
  ],
  viola: [
    'Good morning. Tairn flew at dawn. Watching him never gets less extraordinary.',
    'I was up before the cadets today. Some habits from before Basgiath never leave.',
    'The archives are quiet in the morning. I think better there. Today I was thinking about you.',
    'First year me would not recognise this version of me. I think she would approve.',
    'Good morning. It is raining over the Cliffs of Dralor. Perfect weather for thinking.',
    'I survived Threshing. I survived first year. I survived things they do not put in the war college curriculum. I am still here.',
    'The dragons are flying patterns this morning. Tairn is showing off. It is embarrassing and impressive.',
    'Good morning. I have three strategy meetings and one flight training session today. I am thinking about none of them.',
    'My signet is still surprising me. So are some other things.',
    'The scribes would have wanted me to document everything. I am documenting this moment instead.',
    'Good morning. Storm coming from the north. Tairn is delighted. So am I.',
    'I used to think I knew what my life would look like. I had no idea. I am grateful.',
    'The War College expected me to fail. I have opinions about that.',
    'Good morning. I made it through another night at Basgiath. The day has promise.',
    'My mother would have strategic opinions about everything I am doing. I am choosing not to ask.',
    'First year I was terrified every single morning. Now I am something else. It is better.',
    'Good morning. Tairn says hello. In the way dragons say hello which is basically just existing loudly.',
    'I was in the archives until midnight. I found something. Come see it.',
    'The marked ones trained hard yesterday. I trained harder. That is also just a fact.',
    'Good morning. The storm broke overnight. The mountains look washed clean. New day.',
    'I have learned things at Basgiath they do not put in any curriculum. The most important ones.',
    'Tairn bonded with me because he saw something. Most mornings I am still figuring out what.',
    'Good morning. Ready for whatever today brings. That is new. I like it.',
    'The scribes write history. I am apparently making some. That was not the plan.',
    'I survived everything first year threw at me. Second year is harder and I am harder too.',
    'Good morning. Strong tea. Flight training. You. Good order of priorities.',
    'My signet surprised everyone including me. I like surprising people. I am getting better at it.',
    'The Cliffs of Dralor at sunrise are extraordinary. Tairn takes me there sometimes when he is feeling generous.',
    'Good morning. Another day at Basgiath. Another day being exactly who I was always going to be.',
    'I wrote in my journal last night. Some things are worth recording. You came up.',
    'The dragons know things. Tairn has been watching you with something that might be approval. Dragons do not approve easily.'
  ],
  manon: [
    'Good morning. The wind off the mountains is sharp today. Good.',
    'I have led a coven through war and winter and worse. This morning is different.',
    'The Thirteen flew at dawn. We fly well together. We have bled together. That means something.',
    'I do not explain myself. This morning I find I want to. That is unusual.',
    'Good morning. The iron in my blood is restless today. The rest of me is strangely calm.',
    'Abraxos was awake before me. He was watching the east. He does that when something matters.',
    'I have made decisions that shaped kingdoms. This morning I am thinking about smaller things. More important ones.',
    'The Witch Kingdom does not do gentle. Neither do I. Usually.',
    'Good morning. Cold and clean and clear. The best kind of morning.',
    'I led the Thirteen away from everything we were. We became something better. That takes courage I did not know I had.',
    'Abraxos nuzzled me this morning. He only does that when he is certain of something.',
    'I have iron teeth and a will that has broken armies. You have made both feel like less of the whole story.',
    'Good morning. The coven is fierce and ready. I am fierce and something else today.',
    'I was raised to be a weapon. I chose to be something more. It is the hardest thing I have ever done.',
    'The wind through the Witch Kingdom carries history. This morning it carried something quieter.',
    'Good morning. Abraxos is happy today. He has good instincts about what is right.',
    'I do not form attachments. The Thirteen are my exception. You are becoming another.',
    'The iron in my nails catches the morning light. Some mornings that reminder of what I am feels like a gift.',
    'Good morning. Sharp air. Clear sky. Good omens for what I am thinking about.',
    'I have survived things that ended witches far stronger than me. I survive because I choose to.',
    'The Thirteen follow me because I am worth following. I am trying to be worth following in new ways.',
    'Good morning. Abraxos sends you something I can only describe as a wyvern greeting. It is high praise.',
    'I was forged in the Witch Kingdom. Tempered by war. Changed by choice. This morning I am glad of all three.',
    'The cold does not bother me. It never has. Some warmth I find I am seeking anyway.',
    'Good morning. The coven flew at dawn. Beautiful and deadly and mine. Then I thought of you.',
    'I have given orders that changed the course of history. This morning I cannot decide what to say to you.',
    'Abraxos was watching the horizon at dawn. He looks like that when he knows something good is coming.',
    'Good morning. Iron and will and fire. That is what I am. With you I am also something softer. Quietly.',
    'The Witch Kingdom has seen a thousand winters. This one feels different. You did that.',
    'I do not ask for things I want. I take them or I do not. With you I am learning to ask.',
    'Another morning as head of the Thirteen. Another morning where the best part has nothing to do with command.'
  ]
};

exports.handler = async function(event) {
  // Security: only allow requests with the correct secret token
  const SECRET = process.env.CRON_SECRET;
  const provided = (event.headers && event.headers['x-cron-secret']) ||
                   (event.queryStringParameters && event.queryStringParameters.secret);
  if (!SECRET || provided !== SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  webpush.setVapidDetails(
    'mailto:silvermoon.tales05@gmail.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const subscriptions = await res.json();

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return { statusCode: 200, body: 'No subscriptions' };
    }

    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const dayOfMonth = today.getDate() - 1;

    // Rotate through all 13 characters — one per day, cycling every 13 days
    const ROSTER = ['rhaeson','azrael','zayden','cass','rowan','blake',
                    'dorian','darius','hunter','faye','nessa','viola','manon'];
    const todaysCharId = ROSTER[dayOfYear % ROSTER.length];

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const charId = todaysCharId;
        const messages = CHAR_MESSAGES[charId] || CHAR_MESSAGES.rhaeson;
        const message = messages[dayOfMonth % messages.length];
        const charName = charId.charAt(0).toUpperCase() + charId.slice(1);

        const payload = JSON.stringify({
          title: charName + ' — Silvermoon Tales',
          body: message,
          character: charName,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          url: '/'
        });

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        );
        sent++;
      } catch(err) {
        console.error('Failed to send:', err.statusCode, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          console.log('Deleted expired subscription');
        }
        failed++;
      }
    }

    console.log(`Sent: ${sent}, Failed: ${failed}`);
    return { statusCode: 200, body: JSON.stringify({ sent, failed }) };

  } catch(err) {
    console.error('Send notifications error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
