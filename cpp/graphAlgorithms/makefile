BIN = ~/bin
SHELL = /bin/bash
IDIR = $(shell cd ..; pwd)/include
LDIR = $(shell cd ..; pwd)/lib
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}

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
