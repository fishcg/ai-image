#!/bin/sh
if [ "$1" != 'start' ]; then
   echo "sorry, '$1' is not a command"
   exit 1
fi
exec npm $1
