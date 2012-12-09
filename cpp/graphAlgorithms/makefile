BIN = ~/bin
SHELL = /bin/bash
IDIR = ../include
LDIR = ../lib
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 \
	   -m$(shell getconf LONG_BIT) -I ${IDIR}

all:
	make -C misc    IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mst    IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C sPath  IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C maxFlo IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mcFlo  IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C match  IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C misc   clean
	make -C mst    clean
	make -C sPath  clean
	make -C maxFlo clean
	make -C mcFlo  clean
	make -C match  clean
