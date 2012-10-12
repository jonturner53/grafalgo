# Top level makefile, order of lower-level makes matters
SHELL := /bin/bash
IDIR = $(shell pwd)/include
LDIR = $(shell pwd)/lib
BIN = ~/bin
CXXFLAGS = -O2 -m64 -I ${IDIR}

all:
	make -C misc            IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C dataStructures  IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C graphAlgorithms IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
				CXXFLAGS='${CXXFLAGS}' all

clean:
	rm -f ${LDIR}/lib-util.a ${LDIR}/lib-ds.a ${LDIR}/lib-ga.a
	make -C misc            clean
	make -C dataStructures  clean
	make -C graphAlgorithms clean

