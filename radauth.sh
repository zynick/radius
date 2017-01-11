#! /usr/bin/radtest -f
# https://www.gnu.org/software/radius/manual/html_node/Sample-Radtest-Program.html
while getopt "n:s:P:hv"
begin
  case $OPTVAR in
  "-n") NASIP = $OPTARG 
  "-s") SID = $OPTARG 
  "-P") PID = $OPTARG 
  "-v") set -v
  "-h") begin
#          print <<-EOT     # comment it out to enable syntax highlighting, and because the code doesn't work anyway
           usage: radauth [OPTIONS] [COMMAND] login [password]
           Options are:
           -v         Print verbose descriptions of what is being done
           -n IP      Set NAS IP address
           -s SID     Set session ID
           -P PORT    Set NAS port number
           COMMAND is one of:
           auth       Send only Access-Request (default)
           acct       Send Access-Request. If successfull, send
                      accounting start request
           start      Send accounting start request
           stop       Send accounting stop request
           EOT
          exit 0
        end
  ".*") begin
          print "Unknown option: " $OPTVAR "\n"
          exit 1
        end
  end
end

shift ${OPTIND}-1

if $# > 3
begin
        print "Wrong number of arguments."
        print "Try radauth -h for more info"
        exit 1
end

case $1 in
"auth|acct|start|stop") begin
                          COMMAND=$1
                          shift 1
                        end
".*")   COMMAND="auth"
end

LOGIN=${1:?User name is not specified. Try radauth -h for more info.}

if ${NASIP:-} = ""
        NASIP=$SOURCEIP

LIST = ( User-Name = $LOGIN NAS-IP-Address = $NASIP )

'acct'
begin
  if ${SID:-} = ""
    input "Enter session ID: " SID
  if ${PID:-} = ""
    input "Enter NAS port ID: " PID
  send acct Accounting-Request $1 + (Acct-Session-Id = $SID NAS-Port-Id = $PID)
  if $REPLY_CODE != Accounting-Response
  begin
    print "Accounting failed.\n"
    exit 1  
  end
  print "Accounting OK.\n"
  exit 0
end

'auth'
begin
  send auth Access-Request $1 + (User-Password = $2)
  while 1
  begin
    if $REPLY_CODE = Access-Accept
    begin
      print "Authentication passed. " + $REPLY[Reply-Message*] + "\n"
      if ${3:-no} = no
        exit 0
      'acct'($1 + ( Acct-Status-Type = Start ))
    end else if $REPLY_CODE = Access-Reject
    begin
      print "Authentication failed. " + $REPLY[Reply-Message*] + "\n"
      break
    end else if $REPLY_CODE = Access-Challenge
    begin
      print $REPLY[Reply-Message*]
      input 
      send auth Access-Request \
        (User-Name = $LOGIN User-Password = $INPUT State = $REPLY[State])
    end else begin
      print "Authentication failed. Reply code " + $REPLY_CODE + "\n"
      break
    end
  end
  exit 1
end